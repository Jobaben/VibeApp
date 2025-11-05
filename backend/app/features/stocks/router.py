"""Stock API endpoints."""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.infrastructure.database.session import get_db

logger = logging.getLogger(__name__)
from app.infrastructure.repositories import get_stock_repository, StockRepository
from app.features.stocks.models import Stock, InstrumentType, StockFundamental
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
from app.features.stocks.services.sector_service import SectorService
from app.features.stocks.services.price_data_service import get_price_data_service, PriceDataService
from app.features.stocks.services.score_tracking_service import ScoreTrackingService
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


# ========================
# Scoring & Leaderboard Endpoints
# ========================

@router.post("/scores/calculate", status_code=status.HTTP_200_OK)
async def calculate_all_scores(
    db: Session = Depends(get_db)
):
    """
    Calculate scores for all stocks.

    This endpoint:
    1. Calculates sector averages for all sectors
    2. Calculates scores for all stocks based on their fundamentals
    3. Saves scores to database for fast retrieval

    Use this after importing new stocks or updating fundamentals.

    Args:
        db: Database session

    Returns:
        Result with count of scored stocks
    """
    sector_service = SectorService(db)

    # First, calculate and cache sector averages
    sector_benchmarks = sector_service.calculate_and_cache_sector_averages()

    # Then, calculate scores for all stocks
    scored_count = sector_service.calculate_scores_for_all_stocks()

    return {
        "success": True,
        "scored_count": scored_count,
        "sectors_analyzed": len(sector_benchmarks),
        "message": f"Successfully calculated scores for {scored_count} stocks across {len(sector_benchmarks)} sectors."
    }


@router.get("/{ticker}/score-breakdown")
async def get_score_breakdown(
    ticker: str,
    include_momentum: bool = Query(default=True, description="Include real momentum scoring (requires price data)"),
    db: Session = Depends(get_db),
    price_service: PriceDataService = Depends(get_price_data_service)
):
    """
    Get detailed score breakdown with explanations for a stock.

    This endpoint provides:
    - Total score (0-100) and component scores
    - Buy/Sell signal
    - Strengths and weaknesses
    - Detailed reasoning
    - Component-level scoring details
    - (Phase 4) Real momentum scoring based on technical indicators

    Args:
        ticker: Stock ticker symbol
        include_momentum: Whether to fetch price data and calculate real momentum score
        db: Database session
        price_service: Price data service

    Returns:
        Detailed score breakdown with explanations

    Raises:
        HTTPException: 404 if stock not found or no fundamentals available
    """
    from app.features.stocks.services.scoring_service import ScoringService

    repo = get_stock_repository(db)

    # Get stock with fundamentals
    stock = repo.get_by_ticker(ticker)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ticker '{ticker}' not found"
        )

    stock_full = repo.get_with_full_data(stock.id)

    if not stock_full.fundamentals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No fundamental data available for '{ticker}'"
        )

    # Get sector benchmarks and all fundamentals for scoring
    sector_service = SectorService(db)
    sector_benchmarks = sector_service.get_cached_sector_benchmarks()

    all_fundamentals = db.query(StockFundamental).join(Stock).all()

    # Fetch technical indicators for momentum scoring (Phase 4)
    technical_indicators = None
    if include_momentum:
        try:
            df = price_service.fetch_historical_prices(ticker, period="1y")
            if df is not None and not df.empty:
                df = price_service.calculate_technical_indicators(df)
                technical_indicators = price_service.get_latest_indicators(df)
        except Exception as e:
            logger.warning(f"Could not fetch price data for {ticker}: {e}")

    # Calculate score with optional momentum indicators
    scoring_service = ScoringService(all_fundamentals, sector_benchmarks)
    breakdown = scoring_service.calculate_score(
        stock_full.fundamentals,
        stock_full.sector,
        technical_indicators=technical_indicators
    )

    return {
        "ticker": stock_full.ticker,
        "name": stock_full.name,
        "sector": stock_full.sector,
        "total_score": breakdown.total_score,
        "signal": breakdown.signal.value,
        "component_scores": {
            "value": breakdown.value_score,
            "quality": breakdown.quality_score,
            "momentum": breakdown.momentum_score,
            "health": breakdown.health_score,
        },
        "strengths": breakdown.strengths,
        "weaknesses": breakdown.weaknesses,
        "reasoning": breakdown.reasoning,
        "has_momentum_data": technical_indicators is not None,
    }


@router.get("/leaderboard/top")
async def get_leaderboard(
    limit: int = Query(default=20, le=100, description="Number of top stocks"),
    sector: Optional[str] = Query(default=None, description="Filter by sector"),
    db: Session = Depends(get_db)
):
    """
    Get top-scoring stocks (leaderboard).

    Returns stocks ranked by total score in descending order.
    Optionally filter by sector to see sector leaders.

    Args:
        limit: Number of top stocks to return
        sector: Optional sector filter
        db: Database session

    Returns:
        List of top-scoring stocks with their scores
    """
    from app.features.stocks.models import StockScore

    query = (
        db.query(Stock, StockScore)
        .join(StockScore, Stock.id == StockScore.stock_id)
        .order_by(StockScore.total_score.desc())
    )

    if sector:
        query = query.filter(Stock.sector == sector)

    results = query.limit(limit).all()

    return [
        {
            "ticker": stock.ticker,
            "name": stock.name,
            "sector": stock.sector,
            "total_score": float(score.total_score),
            "signal": score.signal.value,
            "value_score": float(score.value_score),
            "quality_score": float(score.quality_score),
            "momentum_score": float(score.momentum_score),
            "health_score": float(score.health_score),
        }
        for stock, score in results
    ]


@router.get("/leaderboard/by-signal/{signal}")
async def get_stocks_by_signal(
    signal: str,
    limit: int = Query(default=50, le=200, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Get all stocks with a specific signal (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL).

    Args:
        signal: Signal type (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)
        limit: Maximum number of results
        db: Database session

    Returns:
        List of stocks with the specified signal

    Raises:
        HTTPException: 400 if invalid signal
    """
    from app.features.stocks.models import StockScore, Signal

    # Validate signal
    try:
        signal_enum = Signal(signal.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid signal. Must be one of: {', '.join([s.value for s in Signal])}"
        )

    results = (
        db.query(Stock, StockScore)
        .join(StockScore, Stock.id == StockScore.stock_id)
        .filter(StockScore.signal == signal_enum)
        .order_by(StockScore.total_score.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "ticker": stock.ticker,
            "name": stock.name,
            "sector": stock.sector,
            "total_score": float(score.total_score),
            "signal": score.signal.value,
            "value_score": float(score.value_score),
            "quality_score": float(score.quality_score),
            "momentum_score": float(score.momentum_score),
            "health_score": float(score.health_score),
        }
        for stock, score in results
    ]


@router.get("/leaderboard/sectors")
async def get_sector_leaderboards(
    limit_per_sector: int = Query(default=5, le=20, description="Top stocks per sector"),
    db: Session = Depends(get_db)
):
    """
    Get top stocks for each sector.

    Returns a dictionary with sector names as keys and top stocks as values.

    Args:
        limit_per_sector: Number of top stocks to return per sector
        db: Database session

    Returns:
        Dictionary of sector leaderboards
    """
    repo = get_stock_repository(db)
    sectors = repo.get_all_sectors()

    sector_leaderboards = {}

    for sector in sectors:
        from app.features.stocks.models import StockScore

        results = (
            db.query(Stock, StockScore)
            .join(StockScore, Stock.id == StockScore.stock_id)
            .filter(Stock.sector == sector)
            .order_by(StockScore.total_score.desc())
            .limit(limit_per_sector)
            .all()
        )

        sector_leaderboards[sector] = [
            {
                "ticker": stock.ticker,
                "name": stock.name,
                "total_score": float(score.total_score),
                "signal": score.signal.value,
            }
            for stock, score in results
        ]

    return sector_leaderboards


# ========================
# Phase 4: Historical Price Data & Technical Indicators
# ========================

@router.get("/{ticker}/prices/historical")
async def get_historical_prices(
    ticker: str,
    period: str = Query(default="1y", description="Time period (1mo, 3mo, 6mo, 1y, 2y, 5y)"),
    include_indicators: bool = Query(default=True, description="Include technical indicators"),
    db: Session = Depends(get_db),
    price_service: PriceDataService = Depends(get_price_data_service)
):
    """
    Get historical price data for a stock with optional technical indicators.

    This endpoint fetches OHLCV (Open, High, Low, Close, Volume) data and optionally
    calculates technical indicators like RSI, moving averages, and volume trends.

    Args:
        ticker: Stock ticker symbol
        period: Time period for historical data
        include_indicators: Whether to calculate and include technical indicators
        db: Database session
        price_service: Price data service

    Returns:
        Historical price data with optional indicators

    Raises:
        HTTPException: 404 if stock not found
    """
    repo = get_stock_repository(db)

    # Verify stock exists
    stock = repo.get_by_ticker(ticker)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ticker '{ticker}' not found"
        )

    # Fetch historical prices
    df = price_service.fetch_historical_prices(ticker, period=period)

    if df is None or df.empty:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to fetch price data for '{ticker}'"
        )

    # Calculate technical indicators if requested
    if include_indicators:
        df = price_service.calculate_technical_indicators(df)

    # Convert DataFrame to JSON-friendly format
    result = {
        "ticker": ticker,
        "period": period,
        "record_count": len(df),
        "data": df.to_dict(orient='records')
    }

    return result


@router.get("/{ticker}/indicators/latest")
async def get_latest_indicators(
    ticker: str,
    period: str = Query(default="1y", description="Time period for calculation"),
    db: Session = Depends(get_db),
    price_service: PriceDataService = Depends(get_price_data_service)
):
    """
    Get latest technical indicators for a stock.

    Returns the most recent values for:
    - Current price
    - 50-day and 200-day moving averages
    - RSI (14-day)
    - Volume metrics
    - Price vs MA ratios

    Args:
        ticker: Stock ticker symbol
        period: Time period for historical data (affects MA calculations)
        db: Database session
        price_service: Price data service

    Returns:
        Latest technical indicator values

    Raises:
        HTTPException: 404 if stock not found
    """
    repo = get_stock_repository(db)

    # Verify stock exists
    stock = repo.get_by_ticker(ticker)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ticker '{ticker}' not found"
        )

    # Fetch and calculate indicators
    df = price_service.fetch_historical_prices(ticker, period=period)

    if df is None or df.empty:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to fetch price data for '{ticker}'"
        )

    df = price_service.calculate_technical_indicators(df)
    indicators = price_service.get_latest_indicators(df)

    return {
        "ticker": ticker,
        "as_of_date": df.iloc[-1]['date'].isoformat() if not df.empty else None,
        "indicators": indicators
    }


@router.get("/{ticker}/momentum-score")
async def get_momentum_score(
    ticker: str,
    period: str = Query(default="1y", description="Time period for calculation"),
    db: Session = Depends(get_db),
    price_service: PriceDataService = Depends(get_price_data_service)
):
    """
    Calculate and return detailed momentum score for a stock.

    This endpoint:
    1. Fetches historical price data
    2. Calculates technical indicators
    3. Computes momentum score (0-25 points) based on:
       - Price vs 50-day MA (7 pts)
       - Price vs 200-day MA (7 pts)
       - RSI (6 pts)
       - Volume trend (5 pts)

    Args:
        ticker: Stock ticker symbol
        period: Time period for historical data
        db: Database session
        price_service: Price data service

    Returns:
        Detailed momentum score breakdown

    Raises:
        HTTPException: 404 if stock not found
    """
    from app.features.stocks.services.momentum_service import get_momentum_service

    repo = get_stock_repository(db)

    # Verify stock exists
    stock = repo.get_by_ticker(ticker)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ticker '{ticker}' not found"
        )

    # Fetch and calculate indicators
    df = price_service.fetch_historical_prices(ticker, period=period)

    if df is None or df.empty:
        return {
            "ticker": ticker,
            "momentum_score": 12.5,
            "signal": "NEUTRAL",
            "message": "No price data available - using neutral score",
            "components": []
        }

    df = price_service.calculate_technical_indicators(df)
    indicators = price_service.get_latest_indicators(df)

    # Calculate momentum score
    momentum_service = get_momentum_service()
    score, details = momentum_service.calculate_momentum_score(indicators)
    signal = momentum_service.get_momentum_signal(score)
    explanation = momentum_service.explain_momentum_score(details)

    return {
        "ticker": ticker,
        "as_of_date": df.iloc[-1]['date'].isoformat() if not df.empty else None,
        "momentum_score": round(score, 2),
        "signal": signal,
        "explanation": explanation,
        "components": details.components,
        "indicators": details.indicators
    }


# ========================
# Phase 5: Score Change Tracking
# ========================

@router.post("/scores/snapshot", status_code=status.HTTP_200_OK)
async def snapshot_all_scores(
    db: Session = Depends(get_db)
):
    """
    Create a snapshot of current scores for all stocks.

    This endpoint should be run daily (e.g., via cron job) to track score changes over time.
    It captures the current score and signal for all stocks and stores them in the history table.

    Args:
        db: Database session

    Returns:
        Result with count of snapshots created
    """
    tracking_service = ScoreTrackingService(db)
    count = tracking_service.snapshot_all_scores()

    return {
        "success": True,
        "snapshots_created": count,
        "message": f"Successfully created {count} score snapshots."
    }


@router.get("/{ticker}/score-history")
async def get_score_history(
    ticker: str,
    days: int = Query(default=30, le=90, description="Number of days of history"),
    db: Session = Depends(get_db)
):
    """
    Get historical score data for a stock.

    Returns daily score snapshots for the specified time period, showing how
    the stock's total score and component scores have changed over time.

    Args:
        ticker: Stock ticker symbol
        days: Number of days of history to retrieve (max 90)
        db: Database session

    Returns:
        List of historical score records

    Raises:
        HTTPException: 404 if stock not found
    """
    repo = get_stock_repository(db)

    # Verify stock exists
    stock = repo.get_by_ticker(ticker)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ticker '{ticker}' not found"
        )

    tracking_service = ScoreTrackingService(db)
    history = tracking_service.get_score_history(ticker, days=days)

    return {
        "ticker": ticker,
        "days": days,
        "record_count": len(history),
        "history": history
    }


@router.get("/{ticker}/score-change")
async def get_score_change(
    ticker: str,
    days: int = Query(default=7, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Get score change information for a stock over a specified period.

    Compares the current score with the historical score from N days ago,
    showing the change in total score and component scores.

    Args:
        ticker: Stock ticker symbol
        days: Number of days to look back (1, 7, 30, etc.)
        db: Database session

    Returns:
        Score change information including current vs historical scores

    Raises:
        HTTPException: 404 if stock not found or insufficient historical data
    """
    repo = get_stock_repository(db)

    # Verify stock exists
    stock = repo.get_by_ticker(ticker)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ticker '{ticker}' not found"
        )

    tracking_service = ScoreTrackingService(db)
    change = tracking_service.get_score_change(ticker, days=days)

    if not change:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insufficient historical data for '{ticker}' to calculate {days}-day change"
        )

    return change


@router.get("/score-changes/movers")
async def get_top_movers(
    days: int = Query(default=7, description="Number of days to look back"),
    limit: int = Query(default=10, le=50, description="Number of results"),
    direction: str = Query(default="up", description="Direction: 'up' for gainers, 'down' for losers"),
    db: Session = Depends(get_db)
):
    """
    Get stocks with the largest score changes (gainers or losers).

    Returns the top N stocks that had the biggest score increases or decreases
    over the specified time period.

    Args:
        days: Number of days to look back
        limit: Number of results to return
        direction: "up" for gainers, "down" for losers
        db: Database session

    Returns:
        List of top movers with score change details

    Raises:
        HTTPException: 400 if invalid direction
    """
    if direction not in ["up", "down"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direction must be 'up' or 'down'"
        )

    tracking_service = ScoreTrackingService(db)
    movers = tracking_service.get_top_movers(days=days, limit=limit, direction=direction)

    return {
        "period_days": days,
        "direction": direction,
        "count": len(movers),
        "movers": movers
    }


@router.get("/score-changes/signals")
async def get_signal_changes(
    days: int = Query(default=7, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Get stocks that had signal changes (e.g., HOLD -> BUY).

    Returns all stocks where the buy/sell signal changed over the specified period,
    which can indicate important shifts in stock quality or momentum.

    Args:
        days: Number of days to look back
        db: Database session

    Returns:
        List of stocks with signal changes
    """
    tracking_service = ScoreTrackingService(db)
    changes = tracking_service.get_signal_changes(days=days)

    return {
        "period_days": days,
        "count": len(changes),
        "signal_changes": changes
    }
