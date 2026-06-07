import logging
import json
import hashlib
from typing import Any, Optional, Dict, Callable
from datetime import datetime, timedelta
from functools import wraps

logger = logging.getLogger(__name__)


class CacheManager:
    """In-memory cache manager with TTL support."""

    def __init__(self):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl_map: Dict[str, datetime] = {}

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired."""
        if key not in self.cache:
            return None

        if key in self.ttl_map and datetime.utcnow() > self.ttl_map[key]:
            del self.cache[key]
            del self.ttl_map[key]
            logger.debug(f"Cache expired: {key}")
            return None

        logger.debug(f"Cache hit: {key}")
        return self.cache[key]

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set value in cache with TTL."""
        self.cache[key] = value
        self.ttl_map[key] = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        logger.debug(f"Cache set: {key} (TTL: {ttl_seconds}s)")

    def invalidate(self, key: str):
        """Remove entry from cache."""
        if key in self.cache:
            del self.cache[key]
            if key in self.ttl_map:
                del self.ttl_map[key]
            logger.debug(f"Cache invalidated: {key}")

    def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern."""
        keys_to_delete = [k for k in self.cache.keys() if pattern in k]
        for key in keys_to_delete:
            self.invalidate(key)
        if keys_to_delete:
            logger.debug(f"Invalidated {len(keys_to_delete)} cache entries")

    def clear(self):
        """Clear entire cache."""
        self.cache.clear()
        self.ttl_map.clear()
        logger.info("Cache cleared")

    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics."""
        return {
            "total_entries": len(self.cache),
            "memory_usage_bytes": sum(len(str(v)) for v in self.cache.values())
        }

    @staticmethod
    def generate_cache_key(*args, **kwargs) -> str:
        """Generate cache key from arguments."""
        key_parts = [str(arg) for arg in args] + [f"{k}={v}" for k, v in sorted(kwargs.items())]
        key_str = "|".join(key_parts)
        return hashlib.md5(key_str.encode()).hexdigest()


# Global cache instance
_cache_manager = CacheManager()


def cached(ttl_seconds: int = 300):
    """Decorator to cache function results."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = CacheManager.generate_cache_key(func.__name__, *args, **kwargs)

            cached_result = _cache_manager.get(cache_key)
            if cached_result is not None:
                return cached_result

            result = func(*args, **kwargs)
            _cache_manager.set(cache_key, result, ttl_seconds)

            return result

        return wrapper

    return decorator


def get_cache_manager() -> CacheManager:
    """Get global cache manager instance."""
    return _cache_manager


class CacheWarmer:
    """Preload cache with frequently accessed data."""

    @staticmethod
    def warm_workflow_cache(session) -> int:
        """Warm cache with recent workflows."""
        from app.models import Workflow
        from sqlalchemy import desc

        cache_manager = get_cache_manager()
        workflows = session.query(Workflow).filter(
            Workflow.deleted_at == None
        ).order_by(desc(Workflow.created_at)).limit(50).all()

        for workflow in workflows:
            cache_key = CacheManager.generate_cache_key("workflow", workflow.id)
            cache_manager.set(cache_key, workflow, ttl_seconds=600)

        logger.info(f"Warmed cache with {len(workflows)} workflows")
        return len(workflows)

    @staticmethod
    def warm_execution_cache(session) -> int:
        """Warm cache with recent executions."""
        from app.models.execution import Execution
        from sqlalchemy import desc

        cache_manager = get_cache_manager()
        executions = session.query(Execution).order_by(
            desc(Execution.created_at)
        ).limit(100).all()

        for execution in executions:
            cache_key = CacheManager.generate_cache_key("execution", execution.id)
            cache_manager.set(cache_key, execution, ttl_seconds=300)

        logger.info(f"Warmed cache with {len(executions)} executions")
        return len(executions)
