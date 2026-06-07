import time
from typing import Callable, Any

class RetryPolicy:
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0):
        self.max_retries = max_retries
        self.base_delay = base_delay

    def get_delay(self, attempt: int) -> float:
        return self.base_delay * (2 ** attempt)

    def execute_with_retry(self, func: Callable, *args, **kwargs) -> Any:
        last_exception = None

        for attempt in range(self.max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries:
                    delay = self.get_delay(attempt)
                    time.sleep(delay)

        raise last_exception
