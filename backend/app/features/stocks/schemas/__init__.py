"""Stock schemas for API request/response validation."""
from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict

from app.features.stocks.models import InstrumentType, Signal


# Base schemas
class StockBase(BaseModel):
    """Base schema for stock data."""
    ticker: str = Field(..., description="Stock ticker symbol", max_length=20)
    name: str = Field(..., description="Stock name", max_length=255)
    isin: Optional[str] = Field(None, description="ISIN code", max_length=12)
    instrument_type: InstrumentType = Field(default=InstrumentType.STOCK)
    sector: Optional[str] = Field(None, description="Sector", max_length=100)
    industry: Optional[str] = Field(None, description="Industry", max_length=100)
    market_cap: Optional[Decimal] = Field(None, description="Market capitalization")
    currency: str = Field(default="SEK", description="Currency code", max_length=3)
    exchange: Optional[str] = Field(None, description="Exchange", max_length=50)


class StockCreate(StockBase):
    """Schema for creating a stock."""
    pass


class StockUpdate(BaseModel):
    """Schema for updating a stock."""
    name: Optional[str] = Field(None, max_length=255)
    sector: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    market_cap: Optional[Decimal] = None
    exchange: Optional[str] = Field(None, max_length=50)


# Fundamental schemas
class FundamentalsBase(BaseModel):
    """Base schema for stock fundamentals."""
    pe_ratio: Optional[Decimal] = Field(None, description="Price-to-Earnings ratio")
    ev_ebitda: Optional[Decimal] = Field(None, description="EV/EBITDA ratio")
    peg_ratio: Optional[Decimal] = Field(None, description="PEG ratio")
    pb_ratio: Optional[Decimal] = Field(None, description="Price-to-Book ratio")
    ps_ratio: Optional[Decimal] = Field(None, description="Price-to-Sales ratio")
    roic: Optional[Decimal] = Field(None, description="Return on Invested Capital (%)")
    roe: Optional[Decimal] = Field(None, description="Return on Equity (%)")
    gross_margin: Optional[Decimal] = Field(None, description="Gross margin (%)")
    operating_margin: Optional[Decimal] = Field(None, description="Operating margin (%)")
    net_margin: Optional[Decimal] = Field(None, description="Net margin (%)")
    debt_equity: Optional[Decimal] = Field(None, description="Debt-to-Equity ratio")
    current_ratio: Optional[Decimal] = Field(None, description="Current ratio")
    fcf_yield: Optional[Decimal] = Field(None, description="Free Cash Flow yield (%)")
    interest_coverage: Optional[Decimal] = Field(None, description="Interest coverage ratio")
    revenue_growth: Optional[Decimal] = Field(None, description="Revenue growth (%)")
    earnings_growth: Optional[Decimal] = Field(None, description="Earnings growth (%)")
    dividend_yield: Optional[Decimal] = Field(None, description="Dividend yield (%)")
    payout_ratio: Optional[Decimal] = Field(None, description="Payout ratio (%)")


class FundamentalsResponse(FundamentalsBase):
    """Response schema for stock fundamentals."""
    id: UUID
    stock_id: UUID
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Score schemas
class ScoreBase(BaseModel):
    """Base schema for stock scores."""
    total_score: Decimal = Field(..., description="Total score (0-100)")
    value_score: Decimal = Field(..., description="Value score (0-25)")
    quality_score: Decimal = Field(..., description="Quality score (0-25)")
    momentum_score: Decimal = Field(..., description="Momentum score (0-25)")
    health_score: Decimal = Field(..., description="Financial health score (0-25)")
    signal: Signal = Field(..., description="Buy/Hold/Sell signal")


class ScoreResponse(ScoreBase):
    """Response schema for stock scores."""
    id: UUID
    stock_id: UUID
    calculated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Price schemas
class PriceBase(BaseModel):
    """Base schema for stock prices."""
    date: date
    open: Optional[Decimal] = None
    high: Optional[Decimal] = None
    low: Optional[Decimal] = None
    close: Decimal
    volume: Optional[int] = None
    adjusted_close: Optional[Decimal] = None


class PriceResponse(PriceBase):
    """Response schema for stock prices."""
    id: UUID
    stock_id: UUID

    model_config = ConfigDict(from_attributes=True)


# Stock response schemas
class StockListResponse(StockBase):
    """Schema for stock list response (basic info only)."""
    id: UUID
    created_at: datetime
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


class StockDetailResponse(StockBase):
    """Schema for detailed stock response with related data."""
    id: UUID
    created_at: datetime
    last_updated: datetime
    scores: Optional[ScoreResponse] = None
    fundamentals: Optional[FundamentalsResponse] = None

    model_config = ConfigDict(from_attributes=True)


class StockWithPricesResponse(StockDetailResponse):
    """Schema for stock with price history."""
    prices: List[PriceResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Pagination schemas
class PaginationParams(BaseModel):
    """Pagination parameters."""
    skip: int = Field(default=0, ge=0, description="Number of records to skip")
    limit: int = Field(default=100, le=1000, description="Maximum number of records")


class StockListPaginatedResponse(BaseModel):
    """Paginated stock list response."""
    items: List[StockListResponse]
    total: int
    skip: int
    limit: int
    has_more: bool

    model_config = ConfigDict(from_attributes=True)


# Search schemas
class StockSearchParams(BaseModel):
    """Stock search parameters."""
    query: str = Field(..., description="Search query (ticker or name)", min_length=1)
    limit: int = Field(default=20, le=100, description="Maximum number of results")
    instrument_type: Optional[InstrumentType] = Field(None, description="Filter by instrument type")


class StockSearchResponse(BaseModel):
    """Stock search response."""
    results: List[StockListResponse]
    query: str
    total: int

    model_config = ConfigDict(from_attributes=True)


# Import/seed schemas
class StockImportRequest(BaseModel):
    """Request to import stocks from Avanza."""
    instrument_type: Optional[InstrumentType] = Field(default=InstrumentType.STOCK)
    limit: int = Field(default=100, le=1000)


class StockImportResponse(BaseModel):
    """Response from stock import operation."""
    success: bool
    imported_count: int
    skipped_count: int
    message: str


# Export all schemas
__all__ = [
    "StockBase",
    "StockCreate",
    "StockUpdate",
    "FundamentalsBase",
    "FundamentalsResponse",
    "ScoreBase",
    "ScoreResponse",
    "PriceBase",
    "PriceResponse",
    "StockListResponse",
    "StockDetailResponse",
    "StockWithPricesResponse",
    "PaginationParams",
    "StockListPaginatedResponse",
    "StockSearchParams",
    "StockSearchResponse",
    "StockImportRequest",
    "StockImportResponse",
]
