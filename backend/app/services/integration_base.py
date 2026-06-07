from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import logging
import time

logger = logging.getLogger(__name__)


class IntegrationProvider(ABC):
    """Base class for all integration providers."""

    def __init__(self, credentials: Dict[str, Any], config: Optional[Dict[str, Any]] = None):
        self.credentials = credentials
        self.config = config or {}
        self.call_count = 0
        self.rate_limit_remaining = None
        self.last_error = None

    @property
    @abstractmethod
    def integration_type(self) -> str:
        """Return the integration type identifier (e.g., 'slack', 'email')."""
        pass

    @abstractmethod
    def test_connection(self) -> bool:
        """Test the integration connection. Return True if successful."""
        pass

    @abstractmethod
    def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        """Execute an action on the integration."""
        pass

    def log_call(self, action: str, success: bool, error: Optional[str] = None, **metadata):
        """Log integration call for monitoring."""
        self.call_count += 1
        level = logging.INFO if success else logging.ERROR
        logger.log(
            level,
            f"Integration {self.integration_type} action {action}",
            extra={
                "integration_type": self.integration_type,
                "action": action,
                "success": success,
                "error": error,
                "call_count": self.call_count,
                **metadata
            }
        )

    def handle_rate_limit(self, remaining: int, reset_at: Optional[float] = None):
        """Handle rate limit information."""
        self.rate_limit_remaining = remaining
        if remaining == 0 and reset_at:
            wait_time = reset_at - time.time()
            if wait_time > 0:
                logger.warning(
                    f"Rate limit reached for {self.integration_type}. "
                    f"Waiting {wait_time:.1f}s"
                )
                time.sleep(wait_time)

    def handle_error(self, error: str):
        """Handle and log error."""
        self.last_error = error
        logger.error(f"Integration {self.integration_type} error: {error}")


class IntegrationExecutor:
    """Execute integration actions with error handling and monitoring."""

    def __init__(self, provider: IntegrationProvider):
        self.provider = provider

    def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        """Execute action with error handling."""
        try:
            result = self.provider.execute(action, **kwargs)
            self.provider.log_call(action, True, **kwargs)
            return {"success": True, "data": result}
        except Exception as e:
            error_msg = str(e)
            self.provider.log_call(action, False, error=error_msg, **kwargs)
            self.provider.handle_error(error_msg)
            return {"success": False, "error": error_msg}
