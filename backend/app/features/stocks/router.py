"""Stock API endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.infrastructure.database.session import get_db
from app.infrastructure.repositories import get_stock_repository, StockRepository
from app.features.stocks.models import Stock, InstrumentType
from app.features.stocks.schemas import (
    StockListResponse,
    StockDetailResponse,
    StockListPaginatedResponse,
    StockSearchResponse,
    StockImportRequest,
    StockImportResponse,
    ScreenerCriteria,
    ScreenerResponse,
)
from app.features.stocks.services import ScreenerService
from app.features.integrations.yahoo_finance_client import get_yahoo_finance_client, YahooFinanceClient

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/", response_model=StockListPaginatedResponse)
async def list_stocks(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=100, le=1000, description="Maximum number of records"),
    instrument_type: Optional[InstrumentType] = Query(default=None, description="Filter by instrument type"),
    sector: Optional[str] = Query(default=None, description="Filter by sector"),
    db: Session = Depends(get_db)
):
    """
    List all stocks with pagination and optional filtering.

    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        instrument_type: Filter by instrument type (STOCK, FUND, ETF, etc.)
        sector: Filter by sector
        db: Database session

    Returns:
        Paginated list of stocks
    """
    repo = get_stock_repository(db)

    # Get stocks
    stocks = repo.get_all(
        skip=skip,
        limit=limit,
        instrument_type=instrument_type,
        sector=sector
    )

    # Get total count
    total = repo.count(instrument_type=instrument_type, sector=sector)

    return StockListPaginatedResponse(
        items=stocks,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + len(stocks)) < total
    )


@router.get("/search", response_model=StockSearchResponse)
async def search_stocks(
    q: str = Query(..., description="Search query (ticker or name)", min_length=1),
    limit: int = Query(default=20, le=100, description="Maximum number of results"),
    instrument_type: Optional[InstrumentType] = Query(default=None, description="Filter by instrument type"),
    db: Session = Depends(get_db)
):
    """
    Search for stocks by ticker or name.

    Args:
        q: Search query string
        limit: Maximum number of results
        instrument_type: Filter by instrument type
        db: Database session

    Returns:
        Search results
    """
    repo = get_stock_repository(db)

    results = repo.search(
        query=q,
        limit=limit,
        instrument_type=instrument_type
    )

    return StockSearchResponse(
        results=results,
        query=q,
        total=len(results)
    )


@router.get("/top", response_model=list[StockDetailResponse])
async def get_top_stocks(
    limit: int = Query(default=20, le=100, description="Number of top stocks to return"),
    instrument_type: Optional[InstrumentType] = Query(default=None, description="Filter by instrument type"),
    db: Session = Depends(get_db)
):
    """
    Get top-scored stocks.

    Args:
        limit: Number of top stocks to return
        instrument_type: Filter by instrument type
        db: Database session

    Returns:
        List of top-scored stocks
    """
    repo = get_stock_repository(db)

    stocks = repo.get_top_scored_stocks(
        limit=limit,
        instrument_type=instrument_type
    )

    return stocks


@router.get("/sectors", response_model=list[str])
async def list_sectors(db: Session = Depends(get_db)):
    """
    Get list of all available sectors.

    Args:
        db: Database session

    Returns:
        List of sector names
    """
    repo = get_stock_repository(db)
    return repo.get_all_sectors()


@router.get("/{ticker}", response_model=StockDetailResponse)
async def get_stock(
    ticker: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific stock by ticker.

    Args:
        ticker: Stock ticker symbol
        db: Database session

    Returns:
        Stock details with scores and fundamentals

    Raises:
        HTTPException: 404 if stock not found
    """
    repo = get_stock_repository(db)

    # Try to find by ticker
    stock_basic = repo.get_by_ticker(ticker)
    if not stock_basic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ticker '{ticker}' not found"
        )

    # Load full data with relationships
    stock = repo.get_with_full_data(stock_basic.id)

    return stock


@router.get("/id/{stock_id}", response_model=StockDetailResponse)
async def get_stock_by_id(
    stock_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific stock by ID.

    Args:
        stock_id: Stock ID
        db: Database session

    Returns:
        Stock details with scores and fundamentals

    Raises:
        HTTPException: 404 if stock not found
    """
    repo = get_stock_repository(db)

    stock = repo.get_with_full_data(stock_id)

    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ID {stock_id} not found"
        )

    return stock


@router.post("/import", response_model=StockImportResponse)
async def import_stocks_from_yahoo_finance(
    request: StockImportRequest,
    db: Session = Depends(get_db),
    yahoo_client: YahooFinanceClient = Depends(get_yahoo_finance_client)
):
    """
    Import stocks from Yahoo Finance API.

    This endpoint fetches real stock data from Yahoo Finance and imports them into the database.
    Fetches popular Swedish stocks from Stockholm Exchange.

    Args:
        request: Import request parameters
        db: Database session
        yahoo_client: Yahoo Finance client

    Returns:
        Import result with count of imported and skipped stocks
    """
    repo = get_stock_repository(db)

    # Get popular stock symbols (US stocks work reliably with Yahoo Finance)
    symbols = yahoo_client.get_popular_stocks()[:request.limit]

    if not symbols:
        return StockImportResponse(
            success=False,
            imported_count=0,
            skipped_count=0,
            message="No stock symbols available."
        )

    # Fetch quotes for all symbols
    quotes = yahoo_client.get_multiple_quotes(symbols)

    if not quotes:
        return StockImportResponse(
            success=False,
            imported_count=0,
            skipped_count=0,
            message="Failed to fetch stock data from Yahoo Finance. Check network connection."
        )

    imported_count = 0
    skipped_count = 0
    errors = []

    for quote in quotes:
        try:
            # Format data for our database
            stock_data = yahoo_client.format_stock_for_db(quote)

            # Check if stock already exists
            existing = repo.get_by_ticker(stock_data.get("ticker"))

            if existing:
                skipped_count += 1
                continue

            # Create new stock
            stock = Stock(
                ticker=stock_data.get("ticker"),
                name=stock_data.get("name"),
                isin=stock_data.get("isin"),
                instrument_type=InstrumentType(stock_data.get("instrument_type", "STOCK")),
                sector=stock_data.get("sector"),
                industry=stock_data.get("industry"),
                market_cap=stock_data.get("market_cap"),
                currency=stock_data.get("currency", "SEK"),
                exchange=stock_data.get("exchange"),
            )
            repo.create(stock)
            imported_count += 1

        except Exception as e:
            error_msg = f"Error importing stock {quote.get('symbol', 'unknown')}: {str(e)}"
            print(error_msg)
            errors.append(error_msg)
            skipped_count += 1

    message = f"Successfully imported {imported_count} stocks from Yahoo Finance, skipped {skipped_count}."
    if errors:
        message += f" {len(errors)} errors occurred."

    return StockImportResponse(
        success=True,
        imported_count=imported_count,
        skipped_count=skipped_count,
        message=message
    )


@router.delete("/{ticker}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stock(
    ticker: str,
    db: Session = Depends(get_db)
):
    """
    Delete a stock (soft delete).

    Args:
        ticker: Stock ticker symbol
        db: Database session

    Raises:
        HTTPException: 404 if stock not found
    """
    repo = get_stock_repository(db)

    stock = repo.get_by_ticker(ticker)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ticker '{ticker}' not found"
        )

    repo.delete(stock.id)
    return None


# ========================
# Stock Screener Endpoints
# ========================

@router.post("/screener/custom", response_model=ScreenerResponse)
async def custom_screener(
    criteria: ScreenerCriteria,
    db: Session = Depends(get_db)
):
    """
    Screen stocks with custom criteria.

    Filter stocks based on custom valuation, profitability, financial health,
    growth, and dividend metrics.

    Args:
        criteria: Custom screening criteria
        db: Database session

    Returns:
        Screener results with matching stocks
    """
    screener = ScreenerService(db)
    return screener.screen_stocks(criteria)


@router.get("/screener/strategies/value-gems", response_model=ScreenerResponse)
async def value_gems_strategy(
    limit: int = Query(default=50, le=200, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Value Gems Strategy: Low P/E + High ROIC + Low Debt 💎

    Find undervalued quality companies with:
    - P/E < 15 (undervalued)
    - ROIC > 15% (high quality capital allocation)
    - Debt/Equity < 0.5 (financially healthy)

    Target: Long-term value investing

    Args:
        limit: Maximum number of results
        db: Database session

    Returns:
        Screener results with Value Gems stocks
    """
    screener = ScreenerService(db)
    return screener.value_gems_strategy(limit=limit)


@router.get("/screener/strategies/quality-compounders", response_model=ScreenerResponse)
async def quality_compounders_strategy(
    limit: int = Query(default=50, le=200, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Quality Compounders Strategy: High ROIC + High Margins + Growing Revenue 🚀

    Find exceptional wealth-building companies with:
    - ROIC > 20% (exceptional capital efficiency)
    - Net Margin > 15% (highly profitable)
    - Revenue Growth > 0% (growing business)

    Target: Long-term wealth compounding

    Args:
        limit: Maximum number of results
        db: Database session

    Returns:
        Screener results with Quality Compounder stocks
    """
    screener = ScreenerService(db)
    return screener.quality_compounders_strategy(limit=limit)


@router.get("/screener/strategies/dividend-kings", response_model=ScreenerResponse)
async def dividend_kings_strategy(
    limit: int = Query(default=50, le=200, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Dividend Kings Strategy: High Yield + Sustainable Payout 👑

    Find reliable income stocks with:
    - Dividend Yield > 3% (good income)
    - Payout Ratio < 70% (sustainable dividends)
    - Debt/Equity < 1.0 (healthy balance sheet)

    Target: Income generation + stability

    Args:
        limit: Maximum number of results
        db: Database session

    Returns:
        Screener results with Dividend King stocks
    """
    screener = ScreenerService(db)
    return screener.dividend_kings_strategy(limit=limit)


@router.get("/screener/strategies/deep-value", response_model=ScreenerResponse)
async def deep_value_strategy(
    limit: int = Query(default=50, le=200, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Deep Value Strategy: Low P/B + Positive FCF + Not Overleveraged 🔍

    Find distressed turnaround opportunities with:
    - P/B < 2.0 (trading near or below book value)
    - FCF Yield > 3% (positive cash generation)
    - Debt/Equity < 1.0 (manageable leverage)

    Target: Contrarian value investing

    Args:
        limit: Maximum number of results
        db: Database session

    Returns:
        Screener results with Deep Value stocks
    """
    screener = ScreenerService(db)
    return screener.deep_value_strategy(limit=limit)


@router.get("/screener/strategies/explosive-growth", response_model=ScreenerResponse)
async def explosive_growth_strategy(
    limit: int = Query(default=50, le=200, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Explosive Growth Strategy: High Revenue Growth + Low PEG ⚡

    Find high-growth companies at reasonable valuations with:
    - Revenue Growth > 30% (explosive growth)
    - PEG < 2.0 (not overvalued relative to growth)
    - Net Margin > 0% (profitable or near profitability)

    Target: Growth at a reasonable price (GARP)

    Args:
        limit: Maximum number of results
        db: Database session

    Returns:
        Screener results with Explosive Growth stocks
    """
    screener = ScreenerService(db)
    return screener.explosive_growth_strategy(limit=limit)
