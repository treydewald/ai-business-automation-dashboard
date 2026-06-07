import requests
import hmac
import hashlib
import json
import time
from typing import Any, Dict, Optional, List
from app.services.integration_base import IntegrationProvider
import logging

logger = logging.getLogger(__name__)


class SlackIntegration(IntegrationProvider):
    """Slack integration provider for sending messages and notifications."""

    @property
    def integration_type(self) -> str:
        return "slack"

    def test_connection(self) -> bool:
        """Test Slack webhook connection."""
        if "webhook_url" not in self.credentials:
            return False

        try:
            response = requests.post(
                self.credentials["webhook_url"],
                json={"text": "Integration test successful"},
                timeout=5,
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Slack test connection failed: {e}")
            return False

    def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        """Execute Slack action."""
        if action == "send_message":
            return self.send_message(kwargs.get("text", ""), kwargs.get("channel"))
        elif action == "send_blocks":
            return self.send_blocks(kwargs.get("blocks", []), kwargs.get("channel"))
        elif action == "update_message":
            return self.update_message(
                kwargs.get("ts", ""), kwargs.get("text", ""), kwargs.get("channel")
            )
        elif action == "send_thread_reply":
            return self.send_thread_reply(
                kwargs.get("thread_ts", ""),
                kwargs.get("text", ""),
                kwargs.get("channel"),
            )
        else:
            raise ValueError(f"Unknown Slack action: {action}")

    def send_message(self, text: str, channel: Optional[str] = None) -> Dict[str, Any]:
        """Send a simple text message to Slack."""
        payload = {"text": text}
        if channel:
            payload["channel"] = channel

        response = self._post_to_webhook(payload)
        self.log_call("send_message", True, text=text, channel=channel)
        return {"success": True, "message_id": response.get("ts", "")}

    def send_blocks(
        self, blocks: List[Dict[str, Any]], channel: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send formatted message blocks to Slack."""
        payload = {"blocks": blocks}
        if channel:
            payload["channel"] = channel

        response = self._post_to_webhook(payload)
        self.log_call("send_blocks", True, channel=channel)
        return {"success": True, "message_id": response.get("ts", "")}

    def send_thread_reply(
        self, thread_ts: str, text: str, channel: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a reply to a thread."""
        payload = {"text": text, "thread_ts": thread_ts}
        if channel:
            payload["channel"] = channel

        response = self._post_to_webhook(payload)
        self.log_call("send_thread_reply", True, thread_ts=thread_ts)
        return {"success": True, "message_id": response.get("ts", "")}

    def update_message(
        self, ts: str, text: str, channel: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update an existing message."""
        payload = {"text": text, "ts": ts}
        if channel:
            payload["channel"] = channel

        response = self._post_to_webhook(payload)
        self.log_call("update_message", True, ts=ts)
        return {"success": True, "message_id": response.get("ts", "")}

    def _post_to_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Post to Slack webhook with rate limit handling."""
        webhook_url = self.credentials.get("webhook_url")
        if not webhook_url:
            raise ValueError("Missing Slack webhook_url in credentials")

        try:
            response = requests.post(
                webhook_url,
                json=payload,
                timeout=self.config.get("timeout", 10),
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 1))
                self.handle_rate_limit(0, time.time() + retry_after)
                raise RuntimeError(f"Slack rate limited. Retry after {retry_after}s")

            if response.status_code != 200:
                raise RuntimeError(
                    f"Slack webhook failed: {response.status_code} - {response.text}"
                )

            return response.json() if response.text else {}

        except requests.RequestException as e:
            logger.error(f"Slack request failed: {e}")
            raise

    @staticmethod
    def verify_webhook_signature(
        body: str, signature: str, signing_secret: str
    ) -> bool:
        """Verify Slack webhook signature for security."""
        timestamp = signature.split("=")[1].split(",")[0] if "," in signature else ""
        if not timestamp:
            return False

        sig_basestring = f"v0:{timestamp}:{body}"
        computed_signature = (
            "v0="
            + hmac.new(
                signing_secret.encode(), sig_basestring.encode(), hashlib.sha256
            ).hexdigest()
        )
        return hmac.compare_digest(computed_signature, signature)
