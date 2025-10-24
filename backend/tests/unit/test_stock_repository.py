"""Unit tests for StockRepository."""
import pytest
from decimal import Decimal

from app.infrastructure.repositories.stock_repository import (
    StockRepository, get_stock_repository
)
from app.features.stocks.models import (
    Stock, StockScore, StockFundamental, InstrumentType, Signal
)


class TestStockRepositoryInitialization:
    """Test repository initialization."""

    def test_repository_initialization(self, test_db):
        """Test repository initializes with database session."""
        repo = StockRepository(test_db)
        assert repo.db == test_db

    def test_get_stock_repository_factory(self, test_db):
        """Test factory function creates repository."""
        repo = get_stock_repository(test_db)
        assert isinstance(repo, StockRepository)
        assert repo.db == test_db


class TestGetByMethods:
    """Test get_by_* methods."""

    def test_get_by_id_found(self, test_db):
        """Test get_by_id returns stock when found."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        repo = StockRepository(test_db)
        result = repo.get_by_id(stock.id)

        assert result is not None
        assert result.id == stock.id
        assert result.ticker == "AAPL"

    def test_get_by_id_not_found(self, test_db):
        """Test get_by_id returns None when not found."""
        repo = StockRepository(test_db)
        result = repo.get_by_id(99999)

        assert result is None

    def test_get_by_id_ignores_deleted(self, test_db):
        """Test get_by_id ignores soft-deleted stocks."""
        stock = Stock(ticker="AAPL", name="Apple Inc.", is_deleted=True)
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        repo = StockRepository(test_db)
        result = repo.get_by_id(stock.id)

        assert result is None

    def test_get_by_ticker_found(self, test_db):
        """Test get_by_ticker returns stock when found."""
        stock = Stock(ticker="MSFT", name="Microsoft Corporation")
        test_db.add(stock)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_by_ticker("MSFT")

        assert result is not None
        assert result.ticker == "MSFT"

    def test_get_by_ticker_case_insensitive(self, test_db):
        """Test get_by_ticker is case-insensitive."""
        stock = Stock(ticker="GOOGL", name="Alphabet Inc.")
        test_db.add(stock)
        test_db.commit()

        repo = StockRepository(test_db)

        # Should find with lowercase
        result = repo.get_by_ticker("googl")
        assert result is not None
        assert result.ticker == "GOOGL"

        # Should find with mixed case
        result = repo.get_by_ticker("GoOgL")
        assert result is not None

    def test_get_by_ticker_not_found(self, test_db):
        """Test get_by_ticker returns None when not found."""
        repo = StockRepository(test_db)
        result = repo.get_by_ticker("NOTEXIST")

        assert result is None

    def test_get_by_isin_found(self, test_db):
        """Test get_by_isin returns stock when found."""
        stock = Stock(
            ticker="AAPL",
            name="Apple Inc.",
            isin="US0378331005"
        )
        test_db.add(stock)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_by_isin("US0378331005")

        assert result is not None
        assert result.isin == "US0378331005"

    def test_get_by_isin_not_found(self, test_db):
        """Test get_by_isin returns None when not found."""
        repo = StockRepository(test_db)
        result = repo.get_by_isin("INVALID")

        assert result is None


class TestGetAllMethod:
    """Test get_all method."""

    def test_get_all_returns_all_stocks(self, test_db):
        """Test get_all returns all stocks."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc."),
            Stock(ticker="MSFT", name="Microsoft Corporation"),
            Stock(ticker="GOOGL", name="Alphabet Inc.")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_all()

        assert len(result) == 3

    def test_get_all_pagination(self, test_db):
        """Test get_all with pagination."""
        stocks = [
            Stock(ticker=f"TICK{i}", name=f"Stock {i}")
            for i in range(10)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)

        # First page
        page1 = repo.get_all(skip=0, limit=5)
        assert len(page1) == 5

        # Second page
        page2 = repo.get_all(skip=5, limit=5)
        assert len(page2) == 5

        # Ensure no overlap
        page1_ids = {s.id for s in page1}
        page2_ids = {s.id for s in page2}
        assert len(page1_ids & page2_ids) == 0

    def test_get_all_filter_by_instrument_type(self, test_db):
        """Test get_all filters by instrument type."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc.", instrument_type=InstrumentType.STOCK),
            Stock(ticker="SPY", name="S&P 500 ETF", instrument_type=InstrumentType.ETF),
            Stock(ticker="MSFT", name="Microsoft", instrument_type=InstrumentType.STOCK)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)

        # Get only stocks
        stocks_only = repo.get_all(instrument_type=InstrumentType.STOCK)
        assert len(stocks_only) == 2

        # Get only ETFs
        etfs_only = repo.get_all(instrument_type=InstrumentType.ETF)
        assert len(etfs_only) == 1

    def test_get_all_filter_by_sector(self, test_db):
        """Test get_all filters by sector."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc.", sector="Technology"),
            Stock(ticker="MSFT", name="Microsoft", sector="Technology"),
            Stock(ticker="JPM", name="JPMorgan", sector="Financials")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)

        # Get only Technology sector
        tech_stocks = repo.get_all(sector="Technology")
        assert len(tech_stocks) == 2

        # Get only Financials sector
        fin_stocks = repo.get_all(sector="Financials")
        assert len(fin_stocks) == 1

    def test_get_all_ignores_deleted(self, test_db):
        """Test get_all ignores soft-deleted stocks."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc.", is_deleted=False),
            Stock(ticker="MSFT", name="Microsoft", is_deleted=True),
            Stock(ticker="GOOGL", name="Alphabet", is_deleted=False)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_all()

        assert len(result) == 2


class TestSearchMethod:
    """Test search method."""

    def test_search_by_ticker(self, test_db):
        """Test search finds stocks by ticker."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc."),
            Stock(ticker="MSFT", name="Microsoft Corporation"),
            Stock(ticker="AMAT", name="Applied Materials")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)

        # Search for "AA" should find stocks containing "AA"
        result = repo.search("AA")
        assert len(result) >= 1
        tickers = [s.ticker for s in result]
        # Should find at least one of AAPL or AMAT
        assert "AAPL" in tickers or "AMAT" in tickers

    def test_search_by_name(self, test_db):
        """Test search finds stocks by name."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc."),
            Stock(ticker="MSFT", name="Microsoft Corporation"),
            Stock(ticker="GOOGL", name="Alphabet Inc.")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)

        # Search for "Inc" should find AAPL and GOOGL
        result = repo.search("Inc")
        assert len(result) == 2

    def test_search_case_insensitive(self, test_db):
        """Test search is case-insensitive."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()

        repo = StockRepository(test_db)

        # All should find the stock
        assert len(repo.search("apple")) >= 1
        assert len(repo.search("APPLE")) >= 1
        assert len(repo.search("ApPlE")) >= 1

    def test_search_with_limit(self, test_db):
        """Test search respects limit parameter."""
        stocks = [
            Stock(ticker=f"TECH{i}", name=f"Tech Company {i}")
            for i in range(10)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)

        # Search should limit results
        result = repo.search("Tech", limit=5)
        assert len(result) == 5

    def test_search_filter_by_instrument_type(self, test_db):
        """Test search filters by instrument type."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc.", instrument_type=InstrumentType.STOCK),
            Stock(ticker="SPY", name="Apple ETF", instrument_type=InstrumentType.ETF)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)

        # Search for "Apple" with STOCK filter
        result = repo.search("Apple", instrument_type=InstrumentType.STOCK)
        assert len(result) == 1
        assert result[0].ticker == "AAPL"

    def test_search_ignores_deleted(self, test_db):
        """Test search ignores soft-deleted stocks."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc.", is_deleted=False),
            Stock(ticker="APPL2", name="Apple Copy", is_deleted=True)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.search("Apple")

        assert len(result) == 1
        assert result[0].ticker == "AAPL"


class TestGetWithRelatedData:
    """Test methods that load related data."""

    def test_get_with_score(self, test_db):
        """Test get_with_score loads score data."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        score = StockScore(
            stock_id=stock.id,
            total_score=Decimal("85.5"),
            signal=Signal.BUY
        )
        test_db.add(score)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_with_score(stock.id)

        assert result is not None
        assert result.scores is not None
        assert result.scores.total_score == Decimal("85.5")

    def test_get_with_score_no_score(self, test_db):
        """Test get_with_score when stock has no score."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        repo = StockRepository(test_db)
        result = repo.get_with_score(stock.id)

        assert result is not None
        assert result.scores is None

    def test_get_with_fundamentals(self, test_db):
        """Test get_with_fundamentals loads fundamental data."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        fundamentals = StockFundamental(
            stock_id=stock.id,
            pe_ratio=Decimal("25.5"),
            roic=Decimal("45.2")
        )
        test_db.add(fundamentals)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_with_fundamentals(stock.id)

        assert result is not None
        assert result.fundamentals is not None
        assert result.fundamentals.pe_ratio == Decimal("25.5")

    def test_get_with_full_data(self, test_db):
        """Test get_with_full_data loads all related data."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        score = StockScore(
            stock_id=stock.id,
            total_score=Decimal("85.5"),
            signal=Signal.BUY
        )
        fundamentals = StockFundamental(
            stock_id=stock.id,
            pe_ratio=Decimal("25.5")
        )
        test_db.add_all([score, fundamentals])
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_with_full_data(stock.id)

        assert result is not None
        assert result.scores is not None
        assert result.fundamentals is not None


class TestGetTopScoredStocks:
    """Test get_top_scored_stocks method."""

    def test_get_top_scored_stocks(self, test_db):
        """Test get_top_scored_stocks returns stocks ordered by score."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc."),
            Stock(ticker="MSFT", name="Microsoft"),
            Stock(ticker="GOOGL", name="Alphabet")
        ]
        test_db.add_all(stocks)
        test_db.commit()
        for stock in stocks:
            test_db.refresh(stock)

        scores = [
            StockScore(stock_id=stocks[0].id, total_score=Decimal("85")),
            StockScore(stock_id=stocks[1].id, total_score=Decimal("92")),
            StockScore(stock_id=stocks[2].id, total_score=Decimal("78"))
        ]
        test_db.add_all(scores)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_top_scored_stocks(limit=3)

        assert len(result) == 3
        # Should be ordered by score desc: MSFT(92), AAPL(85), GOOGL(78)
        assert result[0].ticker == "MSFT"
        assert result[1].ticker == "AAPL"
        assert result[2].ticker == "GOOGL"

    def test_get_top_scored_stocks_with_limit(self, test_db):
        """Test get_top_scored_stocks respects limit."""
        stocks = [Stock(ticker=f"TICK{i}", name=f"Stock {i}") for i in range(5)]
        test_db.add_all(stocks)
        test_db.commit()
        for stock in stocks:
            test_db.refresh(stock)

        scores = [
            StockScore(stock_id=stock.id, total_score=Decimal(str(90 - i)))
            for i, stock in enumerate(stocks)
        ]
        test_db.add_all(scores)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_top_scored_stocks(limit=3)

        assert len(result) == 3

    def test_get_top_scored_stocks_filter_by_instrument_type(self, test_db):
        """Test get_top_scored_stocks filters by instrument type."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", instrument_type=InstrumentType.STOCK),
            Stock(ticker="SPY", name="SPY ETF", instrument_type=InstrumentType.ETF),
            Stock(ticker="MSFT", name="Microsoft", instrument_type=InstrumentType.STOCK)
        ]
        test_db.add_all(stocks)
        test_db.commit()
        for stock in stocks:
            test_db.refresh(stock)

        scores = [
            StockScore(stock_id=stocks[0].id, total_score=Decimal("85")),
            StockScore(stock_id=stocks[1].id, total_score=Decimal("95")),  # Highest but ETF
            StockScore(stock_id=stocks[2].id, total_score=Decimal("80"))
        ]
        test_db.add_all(scores)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_top_scored_stocks(
            limit=10,
            instrument_type=InstrumentType.STOCK
        )

        # Should only get stocks, not ETF
        assert len(result) == 2
        assert all(s.instrument_type == InstrumentType.STOCK for s in result)


class TestGetBySector:
    """Test get_by_sector method."""

    def test_get_by_sector(self, test_db):
        """Test get_by_sector returns stocks in sector."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", sector="Technology"),
            Stock(ticker="MSFT", name="Microsoft", sector="Technology"),
            Stock(ticker="JPM", name="JPMorgan", sector="Financials")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        tech_stocks = repo.get_by_sector("Technology")

        assert len(tech_stocks) == 2
        assert all(s.sector == "Technology" for s in tech_stocks)

    def test_get_by_sector_ignores_deleted(self, test_db):
        """Test get_by_sector ignores deleted stocks."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", sector="Technology", is_deleted=False),
            Stock(ticker="MSFT", name="Microsoft", sector="Technology", is_deleted=True)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        result = repo.get_by_sector("Technology")

        assert len(result) == 1


class TestCreateMethods:
    """Test create and create_bulk methods."""

    def test_create_stock(self, test_db):
        """Test create method creates and returns stock."""
        stock = Stock(ticker="TSLA", name="Tesla Inc.")

        repo = StockRepository(test_db)
        result = repo.create(stock)

        assert result.id is not None
        assert result.ticker == "TSLA"

        # Verify it's in database
        db_stock = test_db.query(Stock).filter(Stock.ticker == "TSLA").first()
        assert db_stock is not None

    def test_create_bulk(self, test_db):
        """Test create_bulk creates multiple stocks."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc."),
            Stock(ticker="MSFT", name="Microsoft"),
            Stock(ticker="GOOGL", name="Alphabet")
        ]

        repo = StockRepository(test_db)
        result = repo.create_bulk(stocks)

        assert len(result) == 3
        assert all(s.id is not None for s in result)

        # Verify in database
        db_count = test_db.query(Stock).count()
        assert db_count == 3


class TestUpdateMethod:
    """Test update method."""

    def test_update_stock(self, test_db):
        """Test update method updates stock."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        # Update stock
        stock.name = "Apple Corporation"
        stock.sector = "Technology"

        repo = StockRepository(test_db)
        result = repo.update(stock)

        assert result.name == "Apple Corporation"
        assert result.sector == "Technology"


class TestDeleteMethod:
    """Test delete method (soft delete)."""

    def test_delete_stock(self, test_db):
        """Test delete performs soft delete."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        repo = StockRepository(test_db)
        result = repo.delete(stock.id)

        assert result is True

        # Stock should still exist but be marked deleted
        db_stock = test_db.query(Stock).filter(Stock.id == stock.id).first()
        assert db_stock is not None
        assert db_stock.is_deleted is True

    def test_delete_nonexistent_stock(self, test_db):
        """Test delete returns False for nonexistent stock."""
        repo = StockRepository(test_db)
        result = repo.delete(99999)

        assert result is False


class TestCountMethod:
    """Test count method."""

    def test_count_all_stocks(self, test_db):
        """Test count returns total number of stocks."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc."),
            Stock(ticker="MSFT", name="Microsoft"),
            Stock(ticker="GOOGL", name="Alphabet")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        count = repo.count()

        assert count == 3

    def test_count_with_filters(self, test_db):
        """Test count with instrument type and sector filters."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", instrument_type=InstrumentType.STOCK, sector="Technology"),
            Stock(ticker="SPY", name="SPY ETF", instrument_type=InstrumentType.ETF, sector="Technology"),
            Stock(ticker="MSFT", name="Microsoft", instrument_type=InstrumentType.STOCK, sector="Technology"),
            Stock(ticker="JPM", name="JPMorgan", instrument_type=InstrumentType.STOCK, sector="Financials")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)

        # Count stocks only
        stock_count = repo.count(instrument_type=InstrumentType.STOCK)
        assert stock_count == 3

        # Count by sector
        tech_count = repo.count(sector="Technology")
        assert tech_count == 3

        # Count with both filters
        tech_stock_count = repo.count(
            instrument_type=InstrumentType.STOCK,
            sector="Technology"
        )
        assert tech_stock_count == 2

    def test_count_ignores_deleted(self, test_db):
        """Test count ignores soft-deleted stocks."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", is_deleted=False),
            Stock(ticker="MSFT", name="Microsoft", is_deleted=True),
            Stock(ticker="GOOGL", name="Alphabet", is_deleted=False)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        count = repo.count()

        assert count == 2


class TestGetAllSectors:
    """Test get_all_sectors method."""

    def test_get_all_sectors(self, test_db):
        """Test get_all_sectors returns unique sectors."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", sector="Technology"),
            Stock(ticker="MSFT", name="Microsoft", sector="Technology"),
            Stock(ticker="JPM", name="JPMorgan", sector="Financials"),
            Stock(ticker="JNJ", name="Johnson & Johnson", sector="Healthcare")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        sectors = repo.get_all_sectors()

        assert len(sectors) == 3
        assert "Technology" in sectors
        assert "Financials" in sectors
        assert "Healthcare" in sectors

    def test_get_all_sectors_excludes_null(self, test_db):
        """Test get_all_sectors excludes stocks with null sector."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", sector="Technology"),
            Stock(ticker="MSFT", name="Microsoft", sector=None),
            Stock(ticker="GOOGL", name="Alphabet", sector="Technology")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        sectors = repo.get_all_sectors()

        assert len(sectors) == 1
        assert "Technology" in sectors

    def test_get_all_sectors_ignores_deleted(self, test_db):
        """Test get_all_sectors ignores deleted stocks."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", sector="Technology", is_deleted=False),
            Stock(ticker="JPM", name="JPMorgan", sector="Financials", is_deleted=True)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        repo = StockRepository(test_db)
        sectors = repo.get_all_sectors()

        assert len(sectors) == 1
        assert "Technology" in sectors
        assert "Financials" not in sectors
