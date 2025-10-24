"""Repository package for data access layer."""
from app.infrastructure.repositories.stock_repository import (
    StockRepository,
    get_stock_repository,
)

__all__ = ["StockRepository", "get_stock_repository"]
