import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.cache import get_cache_manager
import json

logger = logging.getLogger(__name__)


class CachingMiddleware(BaseHTTPMiddleware):
    """Middleware for caching GET requests."""

    CACHEABLE_METHODS = ["GET"]
    CACHEABLE_PATHS = ["/api/workflows", "/api/executions", "/api/status"]

    async def dispatch(self, request: Request, call_next):
        if request.method not in self.CACHEABLE_METHODS:
            return await call_next(request)

        should_cache = any(request.url.path.startswith(p) for p in self.CACHEABLE_PATHS)
        if not should_cache:
            return await call_next(request)

        cache_manager = get_cache_manager()
        cache_key = f"{request.method}:{request.url.path}:{request.url.query}"

        cached_response = cache_manager.get(cache_key)
        if cached_response:
            logger.debug(f"Cache hit for {request.url.path}")
            return Response(
                content=cached_response["body"],
                status_code=cached_response["status_code"],
                headers=dict(cached_response["headers"]),
                media_type=cached_response.get("media_type", "application/json")
            )

        response = await call_next(request)

        if response.status_code == 200:
            body = b""
            async for chunk in response.body_iterator:
                body += chunk

            ttl = 300
            if "/workflows/" in request.url.path and "/executions/" not in request.url.path:
                ttl = 600

            cache_manager.set(
                cache_key,
                {
                    "body": body,
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "media_type": response.media_type
                },
                ttl_seconds=ttl
            )

            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )

        return response


class CacheInvalidationMiddleware(BaseHTTPMiddleware):
    """Middleware for invalidating cache on mutations."""

    MUTATION_METHODS = ["POST", "PUT", "DELETE", "PATCH"]

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if request.method in self.MUTATION_METHODS:
            cache_manager = get_cache_manager()

            if "/workflows/" in request.url.path:
                cache_manager.invalidate_pattern("workflows")
                logger.debug("Invalidated workflow cache")

            if "/executions/" in request.url.path:
                cache_manager.invalidate_pattern("executions")
                logger.debug("Invalidated execution cache")

        return response
