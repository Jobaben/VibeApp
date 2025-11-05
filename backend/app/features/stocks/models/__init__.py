"""Stock models for database entities."""
from datetime import datetime, date
from enum import Enum
from typing import Optional
from decimal import Decimal

from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime, Date,
    ForeignKey, Enum as SQLEnum, Index, BigInteger
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from app.infrastructure.database.session import Base
from app.shared.models.base import BaseEntity


class InstrumentType(str, Enum):
    """Types of financial instruments."""
    STOCK = "STOCK"
    FUND = "FUND"
    ETF = "ETF"
    CERTIFICATE = "CERTIFICATE"
    BOND = "BOND"
    WARRANT = "WARRANT"
    OTHER = "OTHER"


class Signal(str, Enum):
    """Buy/sell signals based on scoring."""
    STRONG_BUY = "STRONG_BUY"      # 90-100
    BUY = "BUY"                    # 75-89
    HOLD = "HOLD"                  # 50-74
    SELL = "SELL"                  # 25-49
    STRONG_SELL = "STRONG_SELL"    # 0-24


class Stock(BaseEntity):
    """Master data for all tradeable instruments on Avanza."""

    __tablename__ = "stocks"

    # Identifiers
    ticker = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    isin = Column(String(12), unique=True, nullable=True, index=True)
    avanza_id = Column(String(50), unique=True, nullable=True, index=True)

    # Classification
    instrument_type = Column(SQLEnum(InstrumentType), nullable=False, default=InstrumentType.STOCK)
    sector = Column(String(100), nullable=True, index=True)
    industry = Column(String(100), nullable=True)

    # Financial data
    market_cap = Column(Numeric(20, 2), nullable=True)
    currency = Column(String(3), nullable=False, default="SEK")
    exchange = Column(String(50), nullable=True)

    # Metadata
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prices = relationship("StockPrice", back_populates="stock", cascade="all, delete-orphan")
    fundamentals = relationship("StockFundamental", back_populates="stock", uselist=False, cascade="all, delete-orphan")
    scores = relationship("StockScore", back_populates="stock", uselist=False, cascade="all, delete-orphan")
    score_history = relationship("StockScoreHistory", foreign_keys="[StockScoreHistory.stock_id]", cascade="all, delete-orphan")
    watchlist_items = relationship("WatchlistItem", back_populates="stock", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_stock_ticker', 'ticker'),
        Index('idx_stock_sector', 'sector'),
        Index('idx_stock_type', 'instrument_type'),
    )

    def __repr__(self):
        return f"<Stock(ticker={self.ticker}, name={self.name})>"


class StockPrice(BaseEntity):
    """Historical price data for stocks."""

    __tablename__ = "stock_prices"

    stock_id = Column(PGUUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)

    # OHLCV data
    open = Column(Numeric(12, 4), nullable=True)
    high = Column(Numeric(12, 4), nullable=True)
    low = Column(Numeric(12, 4), nullable=True)
    close = Column(Numeric(12, 4), nullable=False)
    volume = Column(BigInteger, nullable=True)
    adjusted_close = Column(Numeric(12, 4), nullable=True)

    # Relationship
    stock = relationship("Stock", back_populates="prices")

    # Indexes
    __table_args__ = (
        Index('idx_stock_price_stock_date', 'stock_id', 'date', unique=True),
        Index('idx_stock_price_date', 'date'),
    )

    def __repr__(self):
        return f"<StockPrice(stock_id={self.stock_id}, date={self.date}, close={self.close})>"


class StockFundamental(BaseEntity):
    """Fundamental metrics for stocks (refreshed regularly)."""

    __tablename__ = "stock_fundamentals"

    stock_id = Column(PGUUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Valuation metrics
    pe_ratio = Column(Numeric(10, 2), nullable=True)
    ev_ebitda = Column(Numeric(10, 2), nullable=True)
    peg_ratio = Column(Numeric(10, 2), nullable=True)
    pb_ratio = Column(Numeric(10, 2), nullable=True)
    ps_ratio = Column(Numeric(10, 2), nullable=True)

    # Profitability metrics
    roic = Column(Numeric(10, 2), nullable=True)  # Return on Invested Capital
    roe = Column(Numeric(10, 2), nullable=True)   # Return on Equity
    gross_margin = Column(Numeric(10, 2), nullable=True)
    operating_margin = Column(Numeric(10, 2), nullable=True)
    net_margin = Column(Numeric(10, 2), nullable=True)

    # Financial health metrics
    debt_equity = Column(Numeric(10, 2), nullable=True)
    current_ratio = Column(Numeric(10, 2), nullable=True)
    fcf_yield = Column(Numeric(10, 2), nullable=True)  # Free Cash Flow Yield
    interest_coverage = Column(Numeric(10, 2), nullable=True)

    # Growth metrics
    revenue_growth = Column(Numeric(10, 2), nullable=True)
    earnings_growth = Column(Numeric(10, 2), nullable=True)

    # Dividend metrics
    dividend_yield = Column(Numeric(10, 2), nullable=True)
    payout_ratio = Column(Numeric(10, 2), nullable=True)

    # Metadata
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    stock = relationship("Stock", back_populates="fundamentals")

    def __repr__(self):
        return f"<StockFundamental(stock_id={self.stock_id}, pe={self.pe_ratio}, roe={self.roe})>"


class StockScore(BaseEntity):
    """Pre-calculated scores for fast retrieval and ranking."""

    __tablename__ = "stock_scores"

    stock_id = Column(PGUUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Overall score (0-100)
    total_score = Column(Numeric(5, 2), nullable=False, default=0)

    # Component scores (0-25 each)
    value_score = Column(Numeric(5, 2), nullable=False, default=0)
    quality_score = Column(Numeric(5, 2), nullable=False, default=0)
    momentum_score = Column(Numeric(5, 2), nullable=False, default=0)
    health_score = Column(Numeric(5, 2), nullable=False, default=0)

    # Signal
    signal = Column(SQLEnum(Signal), nullable=False, default=Signal.HOLD)

    # Metadata
    calculated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    stock = relationship("Stock", back_populates="scores")

    # Indexes
    __table_args__ = (
        Index('idx_stock_score_total', 'total_score', postgresql_ops={'total_score': 'DESC'}),
        Index('idx_stock_score_signal', 'signal'),
    )

    def __repr__(self):
        return f"<StockScore(stock_id={self.stock_id}, total={self.total_score}, signal={self.signal})>"


class StockScoreHistory(BaseEntity):
    """Historical snapshots of stock scores for tracking changes over time."""

    __tablename__ = "stock_score_history"

    stock_id = Column(PGUUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    snapshot_date = Column(Date, nullable=False)

    # Overall score (0-100)
    total_score = Column(Numeric(5, 2), nullable=False)

    # Component scores (0-25 each)
    value_score = Column(Numeric(5, 2), nullable=False)
    quality_score = Column(Numeric(5, 2), nullable=False)
    momentum_score = Column(Numeric(5, 2), nullable=False)
    health_score = Column(Numeric(5, 2), nullable=False)

    # Signal
    signal = Column(SQLEnum(Signal), nullable=False)

    # Relationship
    stock = relationship("Stock", foreign_keys=[stock_id])

    # Indexes
    __table_args__ = (
        Index('idx_score_history_stock_date', 'stock_id', 'snapshot_date', unique=True),
        Index('idx_score_history_date', 'snapshot_date'),
    )

    def __repr__(self):
        return f"<StockScoreHistory(stock_id={self.stock_id}, date={self.snapshot_date}, total={self.total_score})>"


class SectorAverage(BaseEntity):
    """Cached sector benchmarks for comparison."""

    __tablename__ = "sector_averages"

    sector = Column(String(100), unique=True, nullable=False, index=True)

    # Average metrics
    avg_pe = Column(Numeric(10, 2), nullable=True)
    avg_roic = Column(Numeric(10, 2), nullable=True)
    avg_roe = Column(Numeric(10, 2), nullable=True)
    avg_debt_equity = Column(Numeric(10, 2), nullable=True)
    avg_ev_ebitda = Column(Numeric(10, 2), nullable=True)
    avg_gross_margin = Column(Numeric(10, 2), nullable=True)
    avg_operating_margin = Column(Numeric(10, 2), nullable=True)
    avg_net_margin = Column(Numeric(10, 2), nullable=True)

    # Metadata
    stock_count = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<SectorAverage(sector={self.sector}, count={self.stock_count})>"


class Watchlist(BaseEntity):
    """User watchlists (localStorage for MVP, DB for auth version)."""

    __tablename__ = "watchlists"

    # For MVP: user_id is nullable, watchlists stored in localStorage
    # For future: link to user authentication
    user_id = Column(Integer, nullable=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)

    # Relationships
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Watchlist(name={self.name}, items={len(self.items) if self.items else 0})>"


class WatchlistItem(BaseEntity):
    """Items in a watchlist."""

    __tablename__ = "watchlist_items"

    watchlist_id = Column(PGUUID(as_uuid=True), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False)
    stock_id = Column(PGUUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)

    # User notes (optional)
    notes = Column(String(500), nullable=True)
    target_price = Column(Numeric(12, 4), nullable=True)

    # Relationships
    watchlist = relationship("Watchlist", back_populates="items")
    stock = relationship("Stock", back_populates="watchlist_items")

    # Indexes
    __table_args__ = (
        Index('idx_watchlist_item_unique', 'watchlist_id', 'stock_id', unique=True),
    )

    def __repr__(self):
        return f"<WatchlistItem(watchlist_id={self.watchlist_id}, stock_id={self.stock_id})>"


# Export all models
__all__ = [
    "InstrumentType",
    "Signal",
    "Stock",
    "StockPrice",
    "StockFundamental",
    "StockScore",
    "StockScoreHistory",
    "SectorAverage",
    "Watchlist",
    "WatchlistItem",
]
