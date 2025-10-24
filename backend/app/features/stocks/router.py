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
)
from app.features.integrations.avanza import AvanzaClient, get_avanza_client

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
    stock = repo.get_with_full_data(repo.get_by_ticker(ticker).id) if repo.get_by_ticker(ticker) else None

    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with ticker '{ticker}' not found"
        )

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
async def import_stocks_from_avanza(
    request: StockImportRequest,
    db: Session = Depends(get_db),
    avanza: AvanzaClient = Depends(get_avanza_client)
):
    """
    Import stocks from Avanza API.

    This endpoint fetches stocks from Avanza and imports them into the database.
    For MVP, it uses mock data. In production, it should authenticate with Avanza.

    Args:
        request: Import request parameters
        db: Database session
        avanza: Avanza client

    Returns:
        Import result with count of imported and skipped stocks
    """
    repo = get_stock_repository(db)

    # Fetch stocks from Avanza
    avanza_stocks = avanza.get_stock_list(
        instrument_type=request.instrument_type.value,
        limit=request.limit
    )

    if not avanza_stocks:
        return StockImportResponse(
            success=False,
            imported_count=0,
            skipped_count=0,
            message="No stocks fetched from Avanza. Check authentication or network."
        )

    imported_count = 0
    skipped_count = 0

    for stock_data in avanza_stocks:
        # Check if stock already exists
        existing = repo.get_by_ticker(stock_data.get("ticker"))

        if existing:
            skipped_count += 1
            continue

        # Create new stock
        try:
            stock = Stock(
                ticker=stock_data.get("ticker"),
                name=stock_data.get("name"),
                isin=stock_data.get("isin"),
                instrument_type=InstrumentType(stock_data.get("instrument_type", "STOCK")),
                sector=stock_data.get("sector"),
                industry=stock_data.get("industry"),
                currency=stock_data.get("currency", "SEK"),
                exchange=stock_data.get("exchange"),
            )
            repo.create(stock)
            imported_count += 1
        except Exception as e:
            print(f"Error importing stock {stock_data.get('ticker')}: {e}")
            skipped_count += 1

    return StockImportResponse(
        success=True,
        imported_count=imported_count,
        skipped_count=skipped_count,
        message=f"Successfully imported {imported_count} stocks, skipped {skipped_count} existing."
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
