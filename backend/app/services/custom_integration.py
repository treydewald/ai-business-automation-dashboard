"""Service for building and managing custom integrations."""

import json
import httpx
import logging
from typing import Dict, Any, Optional, List
from enum import Enum
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


class AuthType(str, Enum):
    """Authentication types for custom integrations."""
    NONE = "none"
    BASIC = "basic"
    BEARER = "bearer"
    API_KEY = "api_key"
    CUSTOM_HEADER = "custom_header"


class HttpMethod(str, Enum):
    """HTTP methods."""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


@dataclass
class AuthConfig:
    """Authentication configuration."""
    type: AuthType
    credentials: Dict[str, str]

    def apply_to_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        """Apply auth to request headers."""
        if self.type == AuthType.BEARER:
            headers["Authorization"] = f"Bearer {self.credentials.get('token', '')}"
        elif self.type == AuthType.API_KEY:
            key_name = self.credentials.get("key_name", "X-API-Key")
            headers[key_name] = self.credentials.get("value", "")
        elif self.type == AuthType.BASIC:
            import base64
            username = self.credentials.get("username", "")
            password = self.credentials.get("password", "")
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers["Authorization"] = f"Basic {credentials}"
        elif self.type == AuthType.CUSTOM_HEADER:
            headers[self.credentials.get("header_name", "")] = self.credentials.get("value", "")

        return headers


@dataclass
class RequestTemplate:
    """HTTP request template configuration."""
    method: HttpMethod
    url: str
    headers: Dict[str, str]
    body: Optional[str] = None
    params: Dict[str, str] = None
    auth: Optional[AuthConfig] = None

    def __post_init__(self):
        if self.params is None:
            self.params = {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "method": self.method.value,
            "url": self.url,
            "headers": self.headers,
            "body": self.body,
            "params": self.params,
            "auth": {
                "type": self.auth.type.value,
                "credentials": self.auth.credentials,
            } if self.auth else None,
        }


@dataclass
class ResponseMapping:
    """Maps API response to workflow context."""
    extract_json_path: Optional[str] = None
    extract_regex: Optional[str] = None
    extract_header: Optional[str] = None
    transform_jq: Optional[str] = None
    default_value: Any = None

    def extract(self, response: httpx.Response) -> Any:
        """Extract data from response."""
        try:
            if self.extract_json_path:
                import jsonpath_ng
                data = response.json()
                jsonpath_expr = jsonpath_ng.parse(self.extract_json_path)
                matches = [match.value for match in jsonpath_expr.find(data)]
                return matches[0] if matches else self.default_value

            elif self.extract_regex:
                import re
                match = re.search(self.extract_regex, response.text)
                return match.group(1) if match else self.default_value

            elif self.extract_header:
                return response.headers.get(self.extract_header, self.default_value)

            else:
                return response.json()

        except Exception as e:
            logger.error(f"Error extracting response: {e}")
            return self.default_value


@dataclass
class CustomIntegration:
    """Custom integration definition."""
    id: str
    name: str
    description: str
    request_template: RequestTemplate
    response_mapping: ResponseMapping
    owner_id: str
    created_at: datetime
    updated_at: datetime
    tags: List[str] = None
    is_public: bool = False
    test_context: Dict[str, Any] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.test_context is None:
            self.test_context = {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "request_template": self.request_template.to_dict(),
            "response_mapping": {
                "extract_json_path": self.response_mapping.extract_json_path,
                "extract_regex": self.response_mapping.extract_regex,
                "extract_header": self.response_mapping.extract_header,
                "transform_jq": self.response_mapping.transform_jq,
                "default_value": self.response_mapping.default_value,
            },
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "tags": self.tags,
            "is_public": self.is_public,
        }


class CustomIntegrationBuilder:
    """Builder for creating and executing custom integrations."""

    def __init__(self):
        self.integrations: Dict[str, CustomIntegration] = {}

    def create_integration(
        self,
        id: str,
        name: str,
        description: str,
        method: HttpMethod,
        url: str,
        owner_id: str,
        headers: Dict[str, str] = None,
        auth: Optional[AuthConfig] = None,
        tags: List[str] = None,
    ) -> CustomIntegration:
        """Create a new custom integration."""
        now = datetime.utcnow()

        request_template = RequestTemplate(
            method=method,
            url=url,
            headers=headers or {},
            auth=auth,
        )

        response_mapping = ResponseMapping()

        integration = CustomIntegration(
            id=id,
            name=name,
            description=description,
            request_template=request_template,
            response_mapping=response_mapping,
            owner_id=owner_id,
            created_at=now,
            updated_at=now,
            tags=tags or [],
        )

        self.integrations[id] = integration
        return integration

    async def test_integration(
        self,
        integration: CustomIntegration,
        context: Dict[str, Any],
        timeout: float = 30.0,
    ) -> Dict[str, Any]:
        """Test an integration with sample context."""
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                # Prepare request
                url = integration.request_template.url
                for key, value in context.items():
                    url = url.replace(f"{{{{{key}}}}}", str(value))

                headers = integration.request_template.headers.copy()
                if integration.request_template.auth:
                    headers = integration.request_template.auth.apply_to_headers(headers)

                body = integration.request_template.body
                if body:
                    for key, value in context.items():
                        body = body.replace(f"{{{{{key}}}}}", json.dumps(value))

                # Make request
                response = await client.request(
                    integration.request_template.method.value,
                    url,
                    headers=headers,
                    content=body,
                    params=integration.request_template.params,
                )

                # Extract response
                result = integration.response_mapping.extract(response)

                return {
                    "status": "success",
                    "status_code": response.status_code,
                    "result": result,
                    "headers": dict(response.headers),
                }

        except httpx.TimeoutException:
            return {
                "status": "error",
                "message": "Request timeout",
            }
        except Exception as e:
            logger.error(f"Integration test failed: {e}")
            return {
                "status": "error",
                "message": str(e),
            }

    async def execute_integration(
        self,
        integration_id: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute a custom integration."""
        if integration_id not in self.integrations:
            return {
                "status": "error",
                "message": "Integration not found",
            }

        integration = self.integrations[integration_id]
        return await self.test_integration(integration, context)

    def update_response_mapping(
        self,
        integration_id: str,
        extract_json_path: Optional[str] = None,
        extract_regex: Optional[str] = None,
        extract_header: Optional[str] = None,
        default_value: Any = None,
    ) -> bool:
        """Update response mapping for an integration."""
        if integration_id not in self.integrations:
            return False

        integration = self.integrations[integration_id]
        integration.response_mapping = ResponseMapping(
            extract_json_path=extract_json_path,
            extract_regex=extract_regex,
            extract_header=extract_header,
            default_value=default_value,
        )
        integration.updated_at = datetime.utcnow()
        return True

    def delete_integration(self, integration_id: str) -> bool:
        """Delete a custom integration."""
        if integration_id in self.integrations:
            del self.integrations[integration_id]
            return True
        return False

    def get_integration(self, integration_id: str) -> Optional[CustomIntegration]:
        """Get an integration by ID."""
        return self.integrations.get(integration_id)

    def list_integrations(self, owner_id: str = None, tags: List[str] = None) -> List[CustomIntegration]:
        """List integrations, optionally filtered."""
        integrations = list(self.integrations.values())

        if owner_id:
            integrations = [i for i in integrations if i.owner_id == owner_id]

        if tags:
            integrations = [
                i for i in integrations
                if any(tag in i.tags for tag in tags)
            ]

        return integrations


# Global instance
custom_integration_builder = CustomIntegrationBuilder()
