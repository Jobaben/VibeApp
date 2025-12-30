"""Redis caching service for API responses."""
import json
import hashlib
import logging
from typing import Optional, Any
from functools import lru_cache

from redis import Redis
from redis.exceptions import RedisError

from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Redis-based caching service with graceful fallback."""

    def __init__(self, redis_url: str, enabled: bool = True):
        """Initialize cache service.

        Args:
            redis_url: Redis connection URL
            enabled: Whether caching is enabled
        """
        self.enabled = enabled
        self._redis: Optional[Redis] = None

        if self.enabled:
            try:
                self._redis = Redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                self._redis.ping()
                logger.info("Redis cache connected successfully")
            except RedisError as e:
                logger.warning(f"Redis connection failed, caching disabled: {e}")
                self._redis = None
                self.enabled = False

    @property
    def is_available(self) -> bool:
        """Check if Redis is available."""
        if not self._redis:
            return False
        try:
            self._redis.ping()
            return True
        except RedisError:
            return False

    def get(self, key: str) -> Optional[dict]:
        """Get cached value by key.

        Args:
            key: Cache key

        Returns:
            Cached dict or None if not found/error
        """
        if not self._redis:
            return None

        try:
            data = self._redis.get(key)
            if data:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(data)
            logger.debug(f"Cache MISS: {key}")
            return None
        except (RedisError, json.JSONDecodeError) as e:
            logger.warning(f"Cache get error for {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """Set cached value with TTL.

        Args:
            key: Cache key
            value: Value to cache (must be JSON-serializable)
            ttl_seconds: Time-to-live in seconds (default 5 minutes)

        Returns:
            True if cached successfully, False otherwise
        """
        if not self._redis:
            return False

        try:
            serialized = json.dumps(value, default=str)
            self._redis.setex(key, ttl_seconds, serialized)
            logger.debug(f"Cache SET: {key} (TTL: {ttl_seconds}s)")
            return True
        except (RedisError, TypeError) as e:
            logger.warning(f"Cache set error for {key}: {e}")
            return False

    def invalidate(self, pattern: str) -> int:
        """Invalidate all keys matching pattern.

        Args:
            pattern: Key pattern with wildcards (e.g., 'stocks:*')

        Returns:
            Number of keys deleted
        """
        if not self._redis:
            return 0

        try:
            deleted = 0
            for key in self._redis.scan_iter(match=pattern):
                self._redis.delete(key)
                deleted += 1
            logger.info(f"Cache invalidated: {pattern} ({deleted} keys)")
            return deleted
        except RedisError as e:
            logger.warning(f"Cache invalidate error for {pattern}: {e}")
            return 0

    def delete(self, key: str) -> bool:
        """Delete a specific key.

        Args:
            key: Cache key to delete

        Returns:
            True if deleted, False otherwise
        """
        if not self._redis:
            return False

        try:
            result = self._redis.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return result > 0
        except RedisError as e:
            logger.warning(f"Cache delete error for {key}: {e}")
            return False

    def clear_all(self) -> bool:
        """Clear all cache entries (use with caution).

        Returns:
            True if cleared successfully
        """
        if not self._redis:
            return False

        try:
            self._redis.flushdb()
            logger.info("Cache cleared: all keys")
            return True
        except RedisError as e:
            logger.warning(f"Cache clear error: {e}")
            return False


# Global cache service instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get the global cache service instance.

    Returns:
        CacheService instance (creates one if not exists)
    """
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService(
            redis_url=settings.REDIS_URL,
            enabled=settings.REDIS_ENABLED
        )
    return _cache_service


def generate_cache_key(*parts: str) -> str:
    """Generate a cache key from parts.

    Args:
        *parts: Key parts to join with colons

    Returns:
        Cache key string (e.g., 'stocks:list:abc123')
    """
    return ":".join(str(p) for p in parts)


def hash_params(**params) -> str:
    """Generate a hash from query parameters.

    Args:
        **params: Query parameters

    Returns:
        Short hash string
    """
    # Sort params for consistent hashing
    sorted_params = sorted(params.items())
    param_str = str(sorted_params)
    return hashlib.md5(param_str.encode()).hexdigest()[:8]
