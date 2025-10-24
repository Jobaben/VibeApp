"""Unit tests for Stock database models."""
import pytest
from datetime import datetime, date
from decimal import Decimal

from app.features.stocks.models import (
    Stock, StockPrice, StockFundamental, StockScore, SectorAverage,
    Watchlist, WatchlistItem, InstrumentType, Signal
)


class TestInstrumentTypeEnum:
    """Test InstrumentType enum."""

    def test_all_instrument_types(self):
        """Test all instrument type values."""
        assert InstrumentType.STOCK.value == "STOCK"
        assert InstrumentType.FUND.value == "FUND"
        assert InstrumentType.ETF.value == "ETF"
        assert InstrumentType.CERTIFICATE.value == "CERTIFICATE"
        assert InstrumentType.BOND.value == "BOND"
        assert InstrumentType.WARRANT.value == "WARRANT"
        assert InstrumentType.OTHER.value == "OTHER"


class TestSignalEnum:
    """Test Signal enum."""

    def test_all_signals(self):
        """Test all signal values."""
        assert Signal.STRONG_BUY.value == "STRONG_BUY"
        assert Signal.BUY.value == "BUY"
        assert Signal.HOLD.value == "HOLD"
        assert Signal.SELL.value == "SELL"
        assert Signal.STRONG_SELL.value == "STRONG_SELL"


class TestStockModel:
    """Test Stock model."""

    def test_create_stock_minimal(self, test_db):
        """Test creating stock with minimal required fields."""
        stock = Stock(
            ticker="AAPL",
            name="Apple Inc."
        )
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        assert stock.id is not None
        assert stock.ticker == "AAPL"
        assert stock.name == "Apple Inc."
        assert stock.instrument_type == InstrumentType.STOCK
        assert stock.currency == "SEK"
        assert stock.is_deleted is False

    def test_create_stock_full(self, test_db):
        """Test creating stock with all fields."""
        stock = Stock(
            ticker="MSFT",
            name="Microsoft Corporation",
            isin="US5949181045",
            avanza_id="12345",
            instrument_type=InstrumentType.STOCK,
            sector="Technology",
            industry="Software",
            market_cap=Decimal("2500000000000"),
            currency="USD",
            exchange="NASDAQ"
        )
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        assert stock.ticker == "MSFT"
        assert stock.isin == "US5949181045"
        assert stock.sector == "Technology"
        assert stock.market_cap == Decimal("2500000000000")
        assert stock.currency == "USD"

    def test_stock_ticker_unique(self, test_db):
        """Test ticker must be unique."""
        stock1 = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock1)
        test_db.commit()

        stock2 = Stock(ticker="AAPL", name="Apple Copy")
        test_db.add(stock2)

        with pytest.raises(Exception):  # IntegrityError
            test_db.commit()

    def test_stock_isin_unique(self, test_db):
        """Test ISIN must be unique when provided."""
        stock1 = Stock(ticker="AAPL", name="Apple Inc.", isin="US0378331005")
        test_db.add(stock1)
        test_db.commit()

        stock2 = Stock(ticker="AAPL2", name="Apple Copy", isin="US0378331005")
        test_db.add(stock2)

        with pytest.raises(Exception):  # IntegrityError
            test_db.commit()

    def test_stock_repr(self, test_db):
        """Test stock string representation."""
        stock = Stock(ticker="TSLA", name="Tesla Inc.")
        assert repr(stock) == "<Stock(ticker=TSLA, name=Tesla Inc.)>"

    def test_stock_last_updated_auto(self, test_db):
        """Test last_updated is set automatically."""
        stock = Stock(ticker="GOOGL", name="Alphabet Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        assert stock.last_updated is not None
        assert isinstance(stock.last_updated, datetime)


class TestStockPriceModel:
    """Test StockPrice model."""

    def test_create_stock_price_full(self, test_db):
        """Test creating stock price with all fields."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        price = StockPrice(
            stock_id=stock.id,
            date=date(2024, 10, 24),
            open=Decimal("245.50"),
            high=Decimal("248.00"),
            low=Decimal("244.00"),
            close=Decimal("247.50"),
            volume=1500000,
            adjusted_close=Decimal("247.50")
        )
        test_db.add(price)
        test_db.commit()
        test_db.refresh(price)

        assert price.id is not None
        assert price.stock_id == stock.id
        assert price.close == Decimal("247.50")
        assert price.volume == 1500000

    def test_create_stock_price_minimal(self, test_db):
        """Test creating stock price with minimal fields."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        price = StockPrice(
            stock_id=stock.id,
            date=date(2024, 10, 24),
            close=Decimal("247.50")
        )
        test_db.add(price)
        test_db.commit()
        test_db.refresh(price)

        assert price.close == Decimal("247.50")
        assert price.open is None
        assert price.volume is None

    def test_stock_price_unique_stock_date(self, test_db):
        """Test stock_id + date combination must be unique."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        price1 = StockPrice(
            stock_id=stock.id,
            date=date(2024, 10, 24),
            close=Decimal("247.50")
        )
        test_db.add(price1)
        test_db.commit()

        price2 = StockPrice(
            stock_id=stock.id,
            date=date(2024, 10, 24),
            close=Decimal("248.00")
        )
        test_db.add(price2)

        with pytest.raises(Exception):  # IntegrityError
            test_db.commit()

    def test_stock_price_relationship(self, test_db):
        """Test relationship between Stock and StockPrice."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        price = StockPrice(
            stock_id=stock.id,
            date=date(2024, 10, 24),
            close=Decimal("247.50")
        )
        test_db.add(price)
        test_db.commit()

        # Test relationship
        assert stock.prices[0] == price
        assert price.stock == stock

    def test_stock_price_cascade_delete(self, test_db):
        """Test prices are deleted when stock is deleted."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        price = StockPrice(
            stock_id=stock.id,
            date=date(2024, 10, 24),
            close=Decimal("247.50")
        )
        test_db.add(price)
        test_db.commit()

        # Delete stock
        test_db.delete(stock)
        test_db.commit()

        # Verify price is also deleted
        assert test_db.query(StockPrice).filter(StockPrice.id == price.id).first() is None

    def test_stock_price_repr(self, test_db):
        """Test stock price string representation."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        price = StockPrice(
            stock_id=stock.id,
            date=date(2024, 10, 24),
            close=Decimal("247.50")
        )

        assert "stock_id=" in repr(price)
        assert "close=247.50" in repr(price)


class TestStockFundamentalModel:
    """Test StockFundamental model."""

    def test_create_fundamentals_full(self, test_db):
        """Test creating fundamentals with all fields."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        fundamentals = StockFundamental(
            stock_id=stock.id,
            pe_ratio=Decimal("25.5"),
            ev_ebitda=Decimal("18.2"),
            peg_ratio=Decimal("1.8"),
            pb_ratio=Decimal("45.2"),
            ps_ratio=Decimal("7.5"),
            roic=Decimal("45.2"),
            roe=Decimal("148.5"),
            gross_margin=Decimal("43.8"),
            operating_margin=Decimal("30.2"),
            net_margin=Decimal("25.5"),
            debt_equity=Decimal("1.85"),
            current_ratio=Decimal("0.98"),
            fcf_yield=Decimal("3.8"),
            interest_coverage=Decimal("32.5"),
            revenue_growth=Decimal("8.5"),
            earnings_growth=Decimal("12.3"),
            dividend_yield=Decimal("0.5"),
            payout_ratio=Decimal("15.0")
        )
        test_db.add(fundamentals)
        test_db.commit()
        test_db.refresh(fundamentals)

        assert fundamentals.id is not None
        assert fundamentals.pe_ratio == Decimal("25.5")
        assert fundamentals.roic == Decimal("45.2")
        assert fundamentals.dividend_yield == Decimal("0.5")

    def test_fundamentals_stock_relationship(self, test_db):
        """Test relationship between Stock and Fundamentals."""
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

        # Test relationship
        assert stock.fundamentals == fundamentals
        assert fundamentals.stock == stock

    def test_fundamentals_unique_per_stock(self, test_db):
        """Test only one fundamental record per stock."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        fundamentals1 = StockFundamental(
            stock_id=stock.id,
            pe_ratio=Decimal("25.5")
        )
        test_db.add(fundamentals1)
        test_db.commit()

        fundamentals2 = StockFundamental(
            stock_id=stock.id,
            roe=Decimal("148.5")
        )
        test_db.add(fundamentals2)

        with pytest.raises(Exception):  # IntegrityError
            test_db.commit()

    def test_fundamentals_updated_at_auto(self, test_db):
        """Test updated_at is set automatically."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        fundamentals = StockFundamental(
            stock_id=stock.id,
            pe_ratio=Decimal("25.5")
        )
        test_db.add(fundamentals)
        test_db.commit()
        test_db.refresh(fundamentals)

        assert fundamentals.updated_at is not None
        assert isinstance(fundamentals.updated_at, datetime)


class TestStockScoreModel:
    """Test StockScore model."""

    def test_create_score_full(self, test_db):
        """Test creating score with all fields."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        score = StockScore(
            stock_id=stock.id,
            total_score=Decimal("85.5"),
            value_score=Decimal("22.0"),
            quality_score=Decimal("23.5"),
            momentum_score=Decimal("18.0"),
            health_score=Decimal("22.0"),
            signal=Signal.BUY
        )
        test_db.add(score)
        test_db.commit()
        test_db.refresh(score)

        assert score.id is not None
        assert score.total_score == Decimal("85.5")
        assert score.signal == Signal.BUY

    def test_score_defaults(self, test_db):
        """Test score default values."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        score = StockScore(stock_id=stock.id)
        test_db.add(score)
        test_db.commit()
        test_db.refresh(score)

        assert score.total_score == Decimal("0")
        assert score.value_score == Decimal("0")
        assert score.signal == Signal.HOLD

    def test_score_stock_relationship(self, test_db):
        """Test relationship between Stock and Score."""
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

        # Test relationship
        assert stock.scores == score
        assert score.stock == stock

    def test_score_unique_per_stock(self, test_db):
        """Test only one score record per stock."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        score1 = StockScore(stock_id=stock.id)
        test_db.add(score1)
        test_db.commit()

        score2 = StockScore(stock_id=stock.id)
        test_db.add(score2)

        with pytest.raises(Exception):  # IntegrityError
            test_db.commit()

    def test_score_calculated_at_auto(self, test_db):
        """Test calculated_at is set automatically."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        score = StockScore(stock_id=stock.id)
        test_db.add(score)
        test_db.commit()
        test_db.refresh(score)

        assert score.calculated_at is not None
        assert isinstance(score.calculated_at, datetime)


class TestSectorAverageModel:
    """Test SectorAverage model."""

    def test_create_sector_average(self, test_db):
        """Test creating sector average."""
        sector_avg = SectorAverage(
            sector="Technology",
            avg_pe=Decimal("28.5"),
            avg_roic=Decimal("22.3"),
            avg_roe=Decimal("35.8"),
            avg_debt_equity=Decimal("0.85"),
            stock_count=125
        )
        test_db.add(sector_avg)
        test_db.commit()
        test_db.refresh(sector_avg)

        assert sector_avg.id is not None
        assert sector_avg.sector == "Technology"
        assert sector_avg.stock_count == 125

    def test_sector_unique(self, test_db):
        """Test sector name must be unique."""
        sector_avg1 = SectorAverage(sector="Technology", stock_count=100)
        test_db.add(sector_avg1)
        test_db.commit()

        sector_avg2 = SectorAverage(sector="Technology", stock_count=200)
        test_db.add(sector_avg2)

        with pytest.raises(Exception):  # IntegrityError
            test_db.commit()

    def test_sector_average_updated_at(self, test_db):
        """Test updated_at is set automatically."""
        sector_avg = SectorAverage(
            sector="Technology",
            stock_count=100
        )
        test_db.add(sector_avg)
        test_db.commit()
        test_db.refresh(sector_avg)

        assert sector_avg.updated_at is not None


class TestWatchlistModel:
    """Test Watchlist model."""

    def test_create_watchlist(self, test_db):
        """Test creating watchlist."""
        watchlist = Watchlist(
            name="My Tech Stocks",
            description="Technology stocks I'm watching"
        )
        test_db.add(watchlist)
        test_db.commit()
        test_db.refresh(watchlist)

        assert watchlist.id is not None
        assert watchlist.name == "My Tech Stocks"
        assert watchlist.user_id is None

    def test_watchlist_with_user_id(self, test_db):
        """Test watchlist with user_id."""
        watchlist = Watchlist(
            user_id=123,
            name="My Stocks"
        )
        test_db.add(watchlist)
        test_db.commit()
        test_db.refresh(watchlist)

        assert watchlist.user_id == 123


class TestWatchlistItemModel:
    """Test WatchlistItem model."""

    def test_create_watchlist_item(self, test_db):
        """Test creating watchlist item."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)

        watchlist = Watchlist(name="My Stocks")
        test_db.add(watchlist)
        test_db.commit()
        test_db.refresh(stock)
        test_db.refresh(watchlist)

        item = WatchlistItem(
            watchlist_id=watchlist.id,
            stock_id=stock.id,
            notes="Great company",
            target_price=Decimal("300.00")
        )
        test_db.add(item)
        test_db.commit()
        test_db.refresh(item)

        assert item.id is not None
        assert item.notes == "Great company"
        assert item.target_price == Decimal("300.00")

    def test_watchlist_item_relationships(self, test_db):
        """Test watchlist item relationships."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)

        watchlist = Watchlist(name="My Stocks")
        test_db.add(watchlist)
        test_db.commit()
        test_db.refresh(stock)
        test_db.refresh(watchlist)

        item = WatchlistItem(
            watchlist_id=watchlist.id,
            stock_id=stock.id
        )
        test_db.add(item)
        test_db.commit()

        # Test relationships
        assert item in watchlist.items
        assert item.stock == stock
        assert item.watchlist == watchlist

    def test_watchlist_item_unique_stock_per_watchlist(self, test_db):
        """Test stock can only appear once per watchlist."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)

        watchlist = Watchlist(name="My Stocks")
        test_db.add(watchlist)
        test_db.commit()
        test_db.refresh(stock)
        test_db.refresh(watchlist)

        item1 = WatchlistItem(
            watchlist_id=watchlist.id,
            stock_id=stock.id
        )
        test_db.add(item1)
        test_db.commit()

        item2 = WatchlistItem(
            watchlist_id=watchlist.id,
            stock_id=stock.id
        )
        test_db.add(item2)

        with pytest.raises(Exception):  # IntegrityError
            test_db.commit()

    def test_watchlist_cascade_delete(self, test_db):
        """Test items are deleted when watchlist is deleted."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)

        watchlist = Watchlist(name="My Stocks")
        test_db.add(watchlist)
        test_db.commit()
        test_db.refresh(stock)
        test_db.refresh(watchlist)

        item = WatchlistItem(
            watchlist_id=watchlist.id,
            stock_id=stock.id
        )
        test_db.add(item)
        test_db.commit()

        # Delete watchlist
        test_db.delete(watchlist)
        test_db.commit()

        # Verify item is also deleted
        assert test_db.query(WatchlistItem).filter(WatchlistItem.id == item.id).first() is None
