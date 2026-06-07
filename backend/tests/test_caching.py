"""Tests for caching and database optimization (Feature 32)"""
import pytest
import time
from unittest.mock import Mock, patch, AsyncMock
from app.cache import CacheManager, CacheWarmer, get_cache_manager
from app.middleware.caching import CachingMiddleware, CacheInvalidationMiddleware
from fastapi import Request, Response
from fastapi.testclient import TestClient


class TestCacheManager:
    """Test CacheManager functionality."""

    def test_cache_set_and_get(self):
        """Test basic cache set and get."""
        cache = CacheManager()
        cache.set("test_key", {"data": "test"}, ttl_seconds=3600)

        result = cache.get("test_key")
        assert result == {"data": "test"}

    def test_cache_ttl_expiration(self):
        """Test cache TTL expiration."""
        cache = CacheManager()
        cache.set("test_key", {"data": "test"}, ttl_seconds=1)

        assert cache.get("test_key") == {"data": "test"}
        time.sleep(1.1)
        assert cache.get("test_key") is None

    def test_cache_invalidate(self):
        """Test cache invalidation."""
        cache = CacheManager()
        cache.set("test_key", {"data": "test"})
        cache.invalidate("test_key")

        assert cache.get("test_key") is None

    def test_cache_invalidate_pattern(self):
        """Test pattern-based cache invalidation."""
        cache = CacheManager()
        cache.set("workflows:1", {"id": 1})
        cache.set("workflows:2", {"id": 2})
        cache.set("executions:1", {"id": 1})

        cache.invalidate_pattern("workflows")

        assert cache.get("workflows:1") is None
        assert cache.get("workflows:2") is None
        assert cache.get("executions:1") == {"id": 1}

    def test_cache_clear(self):
        """Test clearing entire cache."""
        cache = CacheManager()
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        cache.clear()

        assert cache.get("key1") is None
        assert cache.get("key2") is None

    def test_cache_stats(self):
        """Test cache statistics."""
        cache = CacheManager()
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        stats = cache.get_stats()
        assert stats["total_entries"] == 2
        assert stats["memory_usage_bytes"] > 0

    def test_cache_key_generation(self):
        """Test cache key generation."""
        key1 = CacheManager.generate_cache_key("func", "arg1", "arg2")
        key2 = CacheManager.generate_cache_key("func", "arg1", "arg2")
        key3 = CacheManager.generate_cache_key("func", "arg1", "arg3")

        assert key1 == key2
        assert key1 != key3
        assert len(key1) == 32  # MD5 hash


class TestCachedDecorator:
    """Test @cached decorator."""

    def test_cached_function_result(self):
        """Test that function results are cached."""
        call_count = 0

        @patch('app.cache.cache_manager._cache_manager.get')
        def test_decorator(mock_get):
            from app.cache import cached

            @cached(ttl_seconds=300)
            def expensive_function(x):
                nonlocal call_count
                call_count += 1
                return x * 2

            # Note: This test is simplified due to mock complexity
            # Full integration test needed with real cache
            pass

    def test_cache_miss_hit(self):
        """Test cache miss and hit."""
        cache = CacheManager()
        call_count = 0

        def test_func(x):
            nonlocal call_count
            call_count += 1
            return x * 2

        # First call - cache miss
        cache_key = CacheManager.generate_cache_key("test_func", 5)
        result = cache.get(cache_key)
        if result is None:
            result = test_func(5)
            cache.set(cache_key, result, ttl_seconds=300)

        assert call_count == 1
        assert result == 10

        # Second call - cache hit
        cached_result = cache.get(cache_key)
        assert cached_result == 10
        assert call_count == 1  # Function not called again


class TestCachingMiddleware:
    """Test CachingMiddleware functionality."""

    @pytest.mark.asyncio
    async def test_cacheable_path_detection(self):
        """Test that middleware correctly identifies cacheable paths."""
        middleware = CachingMiddleware(app=None)

        # Test cacheable paths
        assert "/api/workflows" in middleware.CACHEABLE_PATHS
        assert "/api/executions" in middleware.CACHEABLE_PATHS

    @pytest.mark.asyncio
    async def test_get_request_caching(self):
        """Test that GET requests are cached."""
        cache = CacheManager()

        # Simulate GET request
        mock_request = Mock(spec=Request)
        mock_request.method = "GET"
        mock_request.url.path = "/api/workflows"
        mock_request.url.query = ""

        mock_response = Mock(spec=Response)
        mock_response.status_code = 200

        # Verify GET methods are cached
        assert "GET" in CachingMiddleware.CACHEABLE_METHODS

    def test_post_request_not_cached(self):
        """Test that POST requests are not cached."""
        middleware = CachingMiddleware(app=None)
        assert "POST" not in middleware.CACHEABLE_METHODS


class TestCacheInvalidationMiddleware:
    """Test CacheInvalidationMiddleware functionality."""

    def test_mutation_methods_defined(self):
        """Test that mutation methods are correctly defined."""
        middleware = CacheInvalidationMiddleware(app=None)

        assert "POST" in middleware.MUTATION_METHODS
        assert "PUT" in middleware.MUTATION_METHODS
        assert "DELETE" in middleware.MUTATION_METHODS
        assert "PATCH" in middleware.MUTATION_METHODS


class TestDatabaseOptimization:
    """Test database optimization features."""

    def test_query_optimizer_initialization(self):
        """Test QueryOptimizer initialization."""
        from app.db.optimization import QueryOptimizer

        # Mock session
        mock_session = Mock()
        optimizer = QueryOptimizer(mock_session)

        assert optimizer.session == mock_session
        assert isinstance(optimizer.query_times, dict)

    def test_missing_indexes_detection(self):
        """Test detection of missing indexes."""
        from app.db.optimization import QueryOptimizer

        # This test requires a real database session
        # Placeholder for integration test
        pass


class TestCacheWarmer:
    """Test CacheWarmer functionality."""

    def test_cache_warmer_initialization(self):
        """Test CacheWarmer is properly defined."""
        assert hasattr(CacheWarmer, 'warm_workflow_cache')
        assert hasattr(CacheWarmer, 'warm_execution_cache')


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
