"""Unit tests for Stock Pydantic schemas."""
import pytest
from pydantic import ValidationError
from datetime import datetime, date
from decimal import Decimal
from uuid import uuid4

from app.features.stocks.schemas import (
    StockBase,
    StockCreate,
    StockUpdate,
    FundamentalsBase,
    FundamentalsResponse,
    ScoreBase,
    ScoreResponse,
    PriceBase,
    PriceResponse,
    StockListResponse,
    StockDetailResponse,
    StockWithPricesResponse,
    PaginationParams,
    StockListPaginatedResponse,
    StockSearchParams,
    StockSearchResponse,
    StockImportRequest,
    StockImportResponse,
)
from app.features.stocks.models import InstrumentType, Signal


class TestStockBaseSchema:
    """Test StockBase schema validation."""

    def test_stock_base_valid(self):
        """Test valid StockBase creation."""
        stock = StockBase(
            ticker="AAPL",
            name="Apple Inc.",
            isin="US0378331005",
            sector="Technology",
            industry="Consumer Electronics",
            market_cap=Decimal("2500000000000"),
            currency="USD",
            exchange="NASDAQ"
        )

        assert stock.ticker == "AAPL"
        assert stock.name == "Apple Inc."
        assert stock.instrument_type == InstrumentType.STOCK
        assert stock.currency == "USD"

    def test_stock_base_minimal(self):
        """Test StockBase with minimal required fields."""
        stock = StockBase(
            ticker="TSLA",
            name="Tesla Inc."
        )

        assert stock.ticker == "TSLA"
        assert stock.name == "Tesla Inc."
        assert stock.instrument_type == InstrumentType.STOCK
        assert stock.currency == "SEK"  # default value
        assert stock.sector is None

    def test_stock_base_requires_ticker_and_name(self):
        """Test StockBase requires ticker and name."""
        with pytest.raises(ValidationError):
            StockBase(ticker="AAPL")

        with pytest.raises(ValidationError):
            StockBase(name="Apple Inc.")

    def test_stock_base_ticker_max_length(self):
        """Test ticker max length validation."""
        # Valid: 20 chars
        StockBase(ticker="A" * 20, name="Test")

        # Invalid: 21 chars
        with pytest.raises(ValidationError):
            StockBase(ticker="A" * 21, name="Test")

    def test_stock_base_instrument_type_validation(self):
        """Test instrument type validation."""
        stock = StockBase(
            ticker="SPY",
            name="S&P 500 ETF",
            instrument_type=InstrumentType.ETF
        )
        assert stock.instrument_type == InstrumentType.ETF


class TestStockCreateSchema:
    """Test StockCreate schema validation."""

    def test_stock_create_inherits_from_base(self):
        """Test StockCreate inherits all base fields."""
        stock = StockCreate(
            ticker="MSFT",
            name="Microsoft Corporation",
            sector="Technology"
        )

        assert stock.ticker == "MSFT"
        assert stock.name == "Microsoft Corporation"
        assert stock.sector == "Technology"


class TestStockUpdateSchema:
    """Test StockUpdate schema validation."""

    def test_stock_update_all_fields_optional(self):
        """Test all StockUpdate fields are optional."""
        update = StockUpdate()
        assert update.name is None
        assert update.sector is None

    def test_stock_update_partial(self):
        """Test StockUpdate with only some fields."""
        update = StockUpdate(
            name="Updated Name",
            sector="New Sector"
        )

        assert update.name == "Updated Name"
        assert update.sector == "New Sector"
        assert update.market_cap is None


class TestFundamentalsBaseSchema:
    """Test FundamentalsBase schema validation."""

    def test_fundamentals_all_fields(self):
        """Test FundamentalsBase with all fields."""
        fundamentals = FundamentalsBase(
            pe_ratio=Decimal("15.5"),
            ev_ebitda=Decimal("12.3"),
            peg_ratio=Decimal("1.2"),
            pb_ratio=Decimal("3.5"),
            ps_ratio=Decimal("2.1"),
            roic=Decimal("18.5"),
            roe=Decimal("22.3"),
            gross_margin=Decimal("38.5"),
            operating_margin=Decimal("25.2"),
            net_margin=Decimal("20.1"),
            debt_equity=Decimal("0.45"),
            current_ratio=Decimal("1.8"),
            fcf_yield=Decimal("5.2"),
            interest_coverage=Decimal("8.5"),
            revenue_growth=Decimal("15.0"),
            earnings_growth=Decimal("12.5"),
            dividend_yield=Decimal("2.5"),
            payout_ratio=Decimal("35.0")
        )

        assert fundamentals.pe_ratio == Decimal("15.5")
        assert fundamentals.roic == Decimal("18.5")
        assert fundamentals.dividend_yield == Decimal("2.5")

    def test_fundamentals_all_optional(self):
        """Test all FundamentalsBase fields are optional."""
        fundamentals = FundamentalsBase()

        assert fundamentals.pe_ratio is None
        assert fundamentals.roic is None
        assert fundamentals.revenue_growth is None


class TestFundamentalsResponseSchema:
    """Test FundamentalsResponse schema validation."""

    def test_fundamentals_response_includes_metadata(self):
        """Test FundamentalsResponse includes ID and metadata."""
        response = FundamentalsResponse(
            id=uuid4(),
            stock_id=uuid4(),
            updated_at=datetime.now(),
            pe_ratio=Decimal("15.5"),
            roic=Decimal("18.5")
        )

        assert response.id is not None
        assert response.stock_id is not None
        assert response.updated_at is not None


class TestScoreBaseSchema:
    """Test ScoreBase schema validation."""

    def test_score_base_valid(self):
        """Test valid ScoreBase creation."""
        score = ScoreBase(
            total_score=Decimal("82.5"),
            value_score=Decimal("20.0"),
            quality_score=Decimal("22.0"),
            momentum_score=Decimal("18.5"),
            health_score=Decimal("22.0"),
            signal=Signal.BUY
        )

        assert score.total_score == Decimal("82.5")
        assert score.signal == Signal.BUY

    def test_score_base_requires_all_fields(self):
        """Test ScoreBase requires all score fields."""
        with pytest.raises(ValidationError):
            ScoreBase(
                total_score=Decimal("80"),
                value_score=Decimal("20")
                # Missing other fields
            )

    def test_score_base_signal_validation(self):
        """Test signal enum validation."""
        # Valid signals
        for signal in [Signal.STRONG_BUY, Signal.BUY, Signal.HOLD, Signal.SELL, Signal.STRONG_SELL]:
            score = ScoreBase(
                total_score=Decimal("50"),
                value_score=Decimal("12"),
                quality_score=Decimal("13"),
                momentum_score=Decimal("12"),
                health_score=Decimal("13"),
                signal=signal
            )
            assert score.signal == signal


class TestScoreResponseSchema:
    """Test ScoreResponse schema validation."""

    def test_score_response_includes_metadata(self):
        """Test ScoreResponse includes ID and metadata."""
        response = ScoreResponse(
            id=uuid4(),
            stock_id=uuid4(),
            calculated_at=datetime.now(),
            total_score=Decimal("82.5"),
            value_score=Decimal("20.0"),
            quality_score=Decimal("22.0"),
            momentum_score=Decimal("18.5"),
            health_score=Decimal("22.0"),
            signal=Signal.BUY
        )

        assert response.id is not None
        assert response.stock_id is not None
        assert response.calculated_at is not None


class TestPriceBaseSchema:
    """Test PriceBase schema validation."""

    def test_price_base_valid(self):
        """Test valid PriceBase creation."""
        price = PriceBase(
            date=date(2024, 10, 24),
            open=Decimal("245.50"),
            high=Decimal("248.00"),
            low=Decimal("244.00"),
            close=Decimal("247.50"),
            volume=1500000,
            adjusted_close=Decimal("247.50")
        )

        assert price.date == date(2024, 10, 24)
        assert price.close == Decimal("247.50")
        assert price.volume == 1500000

    def test_price_base_minimal(self):
        """Test PriceBase with minimal required fields."""
        price = PriceBase(
            date=date(2024, 10, 24),
            close=Decimal("247.50")
        )

        assert price.date == date(2024, 10, 24)
        assert price.close == Decimal("247.50")
        assert price.open is None
        assert price.volume is None

    def test_price_base_requires_date_and_close(self):
        """Test PriceBase requires date and close."""
        with pytest.raises(ValidationError):
            PriceBase(close=Decimal("100"))

        with pytest.raises(ValidationError):
            PriceBase(date=date(2024, 10, 24))


class TestStockListResponseSchema:
    """Test StockListResponse schema validation."""

    def test_stock_list_response_valid(self):
        """Test valid StockListResponse creation."""
        response = StockListResponse(
            id=uuid4(),
            ticker="AAPL",
            name="Apple Inc.",
            sector="Technology",
            created_at=datetime.now(),
            last_updated=datetime.now()
        )

        assert response.ticker == "AAPL"
        assert response.id is not None
        assert response.created_at is not None


class TestStockDetailResponseSchema:
    """Test StockDetailResponse schema validation."""

    def test_stock_detail_with_scores_and_fundamentals(self):
        """Test StockDetailResponse with all related data."""
        stock_id = uuid4()
        response = StockDetailResponse(
            id=stock_id,
            ticker="AAPL",
            name="Apple Inc.",
            sector="Technology",
            created_at=datetime.now(),
            last_updated=datetime.now(),
            scores=ScoreResponse(
                id=uuid4(),
                stock_id=stock_id,
                calculated_at=datetime.now(),
                total_score=Decimal("85"),
                value_score=Decimal("21"),
                quality_score=Decimal("22"),
                momentum_score=Decimal("20"),
                health_score=Decimal("22"),
                signal=Signal.BUY
            ),
            fundamentals=FundamentalsResponse(
                id=uuid4(),
                stock_id=stock_id,
                updated_at=datetime.now(),
                pe_ratio=Decimal("25.5"),
                roic=Decimal("45.2")
            )
        )

        assert response.scores is not None
        assert response.fundamentals is not None
        assert response.scores.signal == Signal.BUY

    def test_stock_detail_without_scores_and_fundamentals(self):
        """Test StockDetailResponse with no related data."""
        response = StockDetailResponse(
            id=uuid4(),
            ticker="AAPL",
            name="Apple Inc.",
            created_at=datetime.now(),
            last_updated=datetime.now()
        )

        assert response.scores is None
        assert response.fundamentals is None


class TestPaginationParamsSchema:
    """Test PaginationParams schema validation."""

    def test_pagination_params_defaults(self):
        """Test PaginationParams default values."""
        params = PaginationParams()

        assert params.skip == 0
        assert params.limit == 100

    def test_pagination_params_custom(self):
        """Test PaginationParams with custom values."""
        params = PaginationParams(skip=20, limit=50)

        assert params.skip == 20
        assert params.limit == 50

    def test_pagination_params_skip_validation(self):
        """Test skip must be non-negative."""
        # Valid
        PaginationParams(skip=0)
        PaginationParams(skip=100)

        # Invalid: negative
        with pytest.raises(ValidationError):
            PaginationParams(skip=-1)

    def test_pagination_params_limit_validation(self):
        """Test limit must be <= 1000."""
        # Valid
        PaginationParams(limit=1)
        PaginationParams(limit=1000)

        # Invalid: too high
        with pytest.raises(ValidationError):
            PaginationParams(limit=1001)


class TestStockListPaginatedResponseSchema:
    """Test StockListPaginatedResponse schema validation."""

    def test_paginated_response_valid(self):
        """Test valid paginated response."""
        response = StockListPaginatedResponse(
            items=[
                StockListResponse(
                    id=uuid4(),
                    ticker="AAPL",
                    name="Apple Inc.",
                    created_at=datetime.now(),
                    last_updated=datetime.now()
                )
            ],
            total=100,
            page=1,
            page_size=12,
            total_pages=9
        )

        assert len(response.items) == 1
        assert response.total == 100
        assert response.page == 1
        assert response.page_size == 12
        assert response.total_pages == 9

    def test_paginated_response_empty(self):
        """Test paginated response with no items."""
        response = StockListPaginatedResponse(
            items=[],
            total=0,
            page=1,
            page_size=12,
            total_pages=0
        )

        assert len(response.items) == 0
        assert response.total_pages == 0


class TestStockSearchParamsSchema:
    """Test StockSearchParams schema validation."""

    def test_search_params_valid(self):
        """Test valid search params."""
        params = StockSearchParams(query="AAPL", limit=10)

        assert params.query == "AAPL"
        assert params.limit == 10
        assert params.instrument_type is None

    def test_search_params_with_instrument_type(self):
        """Test search params with instrument type filter."""
        params = StockSearchParams(
            query="SPY",
            limit=5,
            instrument_type=InstrumentType.ETF
        )

        assert params.instrument_type == InstrumentType.ETF

    def test_search_params_requires_query(self):
        """Test search params requires query."""
        with pytest.raises(ValidationError):
            StockSearchParams(limit=10)

    def test_search_params_query_min_length(self):
        """Test query must have min length 1."""
        # Valid
        StockSearchParams(query="A")

        # Invalid: empty string
        with pytest.raises(ValidationError):
            StockSearchParams(query="")

    def test_search_params_limit_validation(self):
        """Test limit must be <= 100."""
        # Valid
        StockSearchParams(query="AAPL", limit=100)

        # Invalid
        with pytest.raises(ValidationError):
            StockSearchParams(query="AAPL", limit=101)


class TestStockImportRequestSchema:
    """Test StockImportRequest schema validation."""

    def test_import_request_defaults(self):
        """Test import request default values."""
        request = StockImportRequest()

        assert request.instrument_type == InstrumentType.STOCK
        assert request.limit == 100

    def test_import_request_custom(self):
        """Test import request with custom values."""
        request = StockImportRequest(
            instrument_type=InstrumentType.ETF,
            limit=500
        )

        assert request.instrument_type == InstrumentType.ETF
        assert request.limit == 500

    def test_import_request_limit_validation(self):
        """Test limit must be <= 1000."""
        # Valid
        StockImportRequest(limit=1000)

        # Invalid
        with pytest.raises(ValidationError):
            StockImportRequest(limit=1001)


class TestStockImportResponseSchema:
    """Test StockImportResponse schema validation."""

    def test_import_response_valid(self):
        """Test valid import response."""
        response = StockImportResponse(
            success=True,
            imported_count=50,
            skipped_count=5,
            message="Successfully imported 50 stocks, skipped 5"
        )

        assert response.success is True
        assert response.imported_count == 50
        assert response.skipped_count == 5

    def test_import_response_failure(self):
        """Test import response for failure."""
        response = StockImportResponse(
            success=False,
            imported_count=0,
            skipped_count=0,
            message="Import failed: API error"
        )

        assert response.success is False
        assert response.imported_count == 0
