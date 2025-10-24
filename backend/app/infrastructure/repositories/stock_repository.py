"""Repository for stock data access operations."""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from app.features.stocks.models import (
    Stock, StockPrice, StockFundamental, StockScore, InstrumentType
)
from app.shared.exceptions import NotFoundException


class StockRepository:
    """Repository for stock database operations."""

    def __init__(self, db: Session):
        """
        Initialize repository with database session.

        Args:
            db: SQLAlchemy database session
        """
        self.db = db

    def get_by_id(self, stock_id: int) -> Optional[Stock]:
        """
        Get stock by ID.

        Args:
            stock_id: Stock ID

        Returns:
            Stock or None if not found
        """
        return self.db.query(Stock).filter(
            Stock.id == stock_id,
            Stock.is_deleted == False
        ).first()

    def get_by_ticker(self, ticker: str) -> Optional[Stock]:
        """
        Get stock by ticker symbol.

        Args:
            ticker: Stock ticker

        Returns:
            Stock or None if not found
        """
        return self.db.query(Stock).filter(
            Stock.ticker == ticker.upper(),
            Stock.is_deleted == False
        ).first()

    def get_by_isin(self, isin: str) -> Optional[Stock]:
        """
        Get stock by ISIN.

        Args:
            isin: ISIN code

        Returns:
            Stock or None if not found
        """
        return self.db.query(Stock).filter(
            Stock.isin == isin,
            Stock.is_deleted == False
        ).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        instrument_type: Optional[InstrumentType] = None,
        sector: Optional[str] = None
    ) -> List[Stock]:
        """
        Get all stocks with optional filtering.

        Args:
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            instrument_type: Filter by instrument type
            sector: Filter by sector

        Returns:
            List of stocks
        """
        query = self.db.query(Stock).filter(Stock.is_deleted == False)

        if instrument_type:
            query = query.filter(Stock.instrument_type == instrument_type)

        if sector:
            query = query.filter(Stock.sector == sector)

        return query.offset(skip).limit(limit).all()

    def search(
        self,
        query: str,
        limit: int = 20,
        instrument_type: Optional[InstrumentType] = None
    ) -> List[Stock]:
        """
        Search stocks by ticker or name.

        Args:
            query: Search query string
            limit: Maximum number of results
            instrument_type: Filter by instrument type

        Returns:
            List of matching stocks
        """
        search_filter = or_(
            Stock.ticker.ilike(f"%{query}%"),
            Stock.name.ilike(f"%{query}%")
        )

        db_query = self.db.query(Stock).filter(
            Stock.is_deleted == False,
            search_filter
        )

        if instrument_type:
            db_query = db_query.filter(Stock.instrument_type == instrument_type)

        return db_query.limit(limit).all()

    def get_with_score(self, stock_id: int) -> Optional[Stock]:
        """
        Get stock with its score data loaded.

        Args:
            stock_id: Stock ID

        Returns:
            Stock with score or None if not found
        """
        return self.db.query(Stock).options(
            joinedload(Stock.scores)
        ).filter(
            Stock.id == stock_id,
            Stock.is_deleted == False
        ).first()

    def get_with_fundamentals(self, stock_id: int) -> Optional[Stock]:
        """
        Get stock with fundamental data loaded.

        Args:
            stock_id: Stock ID

        Returns:
            Stock with fundamentals or None if not found
        """
        return self.db.query(Stock).options(
            joinedload(Stock.fundamentals)
        ).filter(
            Stock.id == stock_id,
            Stock.is_deleted == False
        ).first()

    def get_with_full_data(self, stock_id: int) -> Optional[Stock]:
        """
        Get stock with all related data loaded (scores, fundamentals).

        Args:
            stock_id: Stock ID

        Returns:
            Stock with all data or None if not found
        """
        return self.db.query(Stock).options(
            joinedload(Stock.scores),
            joinedload(Stock.fundamentals)
        ).filter(
            Stock.id == stock_id,
            Stock.is_deleted == False
        ).first()

    def get_top_scored_stocks(
        self,
        limit: int = 20,
        instrument_type: Optional[InstrumentType] = None
    ) -> List[Stock]:
        """
        Get top-scored stocks.

        Args:
            limit: Maximum number of results
            instrument_type: Filter by instrument type

        Returns:
            List of top-scored stocks
        """
        query = self.db.query(Stock).join(StockScore).filter(
            Stock.is_deleted == False
        ).order_by(StockScore.total_score.desc())

        if instrument_type:
            query = query.filter(Stock.instrument_type == instrument_type)

        return query.limit(limit).all()

    def get_by_sector(self, sector: str) -> List[Stock]:
        """
        Get all stocks in a specific sector.

        Args:
            sector: Sector name

        Returns:
            List of stocks in the sector
        """
        return self.db.query(Stock).filter(
            Stock.sector == sector,
            Stock.is_deleted == False
        ).all()

    def create(self, stock: Stock) -> Stock:
        """
        Create a new stock.

        Args:
            stock: Stock object to create

        Returns:
            Created stock
        """
        self.db.add(stock)
        self.db.commit()
        self.db.refresh(stock)
        return stock

    def create_bulk(self, stocks: List[Stock]) -> List[Stock]:
        """
        Create multiple stocks in bulk.

        Args:
            stocks: List of Stock objects to create

        Returns:
            Created stocks
        """
        self.db.add_all(stocks)
        self.db.commit()
        for stock in stocks:
            self.db.refresh(stock)
        return stocks

    def update(self, stock: Stock) -> Stock:
        """
        Update an existing stock.

        Args:
            stock: Stock object with updated data

        Returns:
            Updated stock
        """
        self.db.commit()
        self.db.refresh(stock)
        return stock

    def delete(self, stock_id: int) -> bool:
        """
        Soft delete a stock.

        Args:
            stock_id: Stock ID

        Returns:
            True if deleted, False if not found
        """
        stock = self.get_by_id(stock_id)
        if stock:
            stock.is_deleted = True
            self.db.commit()
            return True
        return False

    def count(
        self,
        instrument_type: Optional[InstrumentType] = None,
        sector: Optional[str] = None
    ) -> int:
        """
        Count stocks with optional filtering.

        Args:
            instrument_type: Filter by instrument type
            sector: Filter by sector

        Returns:
            Count of stocks
        """
        query = self.db.query(func.count(Stock.id)).filter(Stock.is_deleted == False)

        if instrument_type:
            query = query.filter(Stock.instrument_type == instrument_type)

        if sector:
            query = query.filter(Stock.sector == sector)

        return query.scalar()

    def get_all_sectors(self) -> List[str]:
        """
        Get list of all unique sectors.

        Returns:
            List of sector names
        """
        sectors = self.db.query(Stock.sector).filter(
            Stock.is_deleted == False,
            Stock.sector.isnot(None)
        ).distinct().all()

        return [sector[0] for sector in sectors]


def get_stock_repository(db: Session) -> StockRepository:
    """
    Factory function to create stock repository.

    Args:
        db: Database session

    Returns:
        StockRepository instance
    """
    return StockRepository(db)
