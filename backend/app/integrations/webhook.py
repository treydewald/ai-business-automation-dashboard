import requests
import json
import time
import base64
from typing import Any, Dict, Optional, List, Literal
from app.services.integration_base import IntegrationProvider
import logging

logger = logging.getLogger(__name__)

HTTPMethod = Literal["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]


class WebhookIntegration(IntegrationProvider):
    """Generic webhook/HTTP integration for calling external APIs."""

    @property
    def integration_type(self) -> str:
        return "webhook"

    def test_connection(self) -> bool:
        """Test webhook connectivity with a simple request."""
        try:
            url = self.credentials.get("url")
            if not url:
                return False

            # Use a HEAD or GET request for testing
            method = self.config.get("test_method", "GET").upper()
            timeout = self.config.get("timeout", 10)

            response = requests.request(
                method=method,
                url=url,
                headers=self._build_headers(),
                timeout=timeout,
                allow_redirects=True,
            )
            # Accept any non-5xx response as successful
            return response.status_code < 500
        except Exception as e:
            logger.error(f"Webhook test connection failed: {e}")
            return False

    def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        """Execute webhook call."""
        if action == "call":
            return self.call(
                method=kwargs.get("method", "POST"),
                url=kwargs.get("url"),
                headers=kwargs.get("headers", {}),
                body=kwargs.get("body"),
                auth=kwargs.get("auth"),
                timeout=kwargs.get("timeout"),
                retries=kwargs.get("retries", 3),
            )
        else:
            raise ValueError(f"Unknown webhook action: {action}")

    def call(
        self,
        method: HTTPMethod = "POST",
        url: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[Any] = None,
        auth: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = None,
        retries: int = 3,
    ) -> Dict[str, Any]:
        """Make HTTP request with retry logic."""
        # Use credentials URL if not specified
        if not url:
            url = self.credentials.get("url")
        if not url:
            raise ValueError("Missing webhook URL")

        method = method.upper()
        if method not in ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]:
            raise ValueError(f"Unsupported HTTP method: {method}")

        # Build request headers
        request_headers = self._build_headers()
        if headers:
            request_headers.update(headers)

        # Build auth
        if not auth:
            auth = self.credentials.get("auth")

        # Get timeout
        if timeout is None:
            timeout = self.config.get("timeout", 30)

        # Retry loop with exponential backoff
        last_error = None
        for attempt in range(retries):
            try:
                response = self._make_request(
                    method=method,
                    url=url,
                    headers=request_headers,
                    body=body,
                    auth=auth,
                    timeout=timeout,
                )

                # Check status code
                if response.status_code >= 400:
                    error_msg = (
                        f"HTTP {response.status_code}: {response.text[:200]}"
                    )
                    if response.status_code >= 500 and attempt < retries - 1:
                        # Retry on 5xx errors
                        last_error = error_msg
                        wait_time = 2 ** attempt  # Exponential backoff
                        logger.warning(
                            f"Webhook request failed with {response.status_code}. "
                            f"Retrying in {wait_time}s..."
                        )
                        time.sleep(wait_time)
                        continue
                    raise RuntimeError(error_msg)

                # Parse response
                result = self._parse_response(response)

                self.log_call(
                    "call",
                    True,
                    method=method,
                    url=url,
                    status=response.status_code,
                    bytes_received=len(response.content),
                )

                return {
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "body": result,
                    "raw_text": response.text,
                }

            except requests.RequestException as e:
                last_error = str(e)
                if attempt < retries - 1:
                    wait_time = 2 ** attempt
                    logger.warning(
                        f"Webhook request failed: {e}. Retrying in {wait_time}s..."
                    )
                    time.sleep(wait_time)
                else:
                    error_msg = f"Webhook request failed after {retries} retries: {last_error}"
                    self.log_call("call", False, error=error_msg, method=method, url=url)
                    self.handle_error(error_msg)
                    raise RuntimeError(error_msg)

        raise RuntimeError(f"Webhook request failed: {last_error}")

    def _build_headers(self) -> Dict[str, str]:
        """Build headers from credentials and config."""
        headers = {"Content-Type": "application/json"}

        # Add custom headers from config
        if "headers" in self.config:
            headers.update(self.config["headers"])

        return headers

    def _make_request(
        self,
        method: HTTPMethod,
        url: str,
        headers: Dict[str, str],
        body: Optional[Any],
        auth: Optional[Dict[str, str]],
        timeout: int,
    ) -> requests.Response:
        """Make HTTP request with authentication."""
        kwargs = {
            "method": method,
            "url": url,
            "headers": headers,
            "timeout": timeout,
            "allow_redirects": True,
        }

        # Add body if method supports it
        if method not in ["GET", "HEAD", "DELETE"]:
            if body is not None:
                if isinstance(body, (dict, list)):
                    kwargs["json"] = body
                else:
                    kwargs["data"] = body

        # Add authentication
        if auth:
            auth_type = auth.get("type", "bearer").lower()
            if auth_type == "basic":
                username = auth.get("username", "")
                password = auth.get("password", "")
                kwargs["auth"] = (username, password)
            elif auth_type == "bearer":
                token = auth.get("token", "")
                kwargs["headers"]["Authorization"] = f"Bearer {token}"
            elif auth_type == "custom":
                # Custom header-based auth
                header_name = auth.get("header_name", "Authorization")
                header_value = auth.get("header_value", "")
                kwargs["headers"][header_name] = header_value
            elif auth_type == "api_key":
                key_name = auth.get("key_name", "X-API-Key")
                key_value = auth.get("key_value", "")
                kwargs["headers"][key_name] = key_value

        return requests.request(**kwargs)

    def _parse_response(self, response: requests.Response) -> Any:
        """Parse response body as JSON if possible, otherwise return text."""
        if not response.text:
            return None

        content_type = response.headers.get("content-type", "").lower()
        if "application/json" in content_type:
            try:
                return response.json()
            except json.JSONDecodeError:
                return response.text
        return response.text
