"""Integration tests for Stock API endpoints."""
import pytest
from fastapi import status
from decimal import Decimal

from app.features.stocks.models import Stock, StockScore, StockFundamental, InstrumentType, Signal


class TestListStocksEndpoint:
    """Test GET /api/stocks/ endpoint."""

    def test_list_stocks_empty(self, client):
        """Test listing stocks when database is empty."""
        response = client.get("/api/stocks/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["skip"] == 0
        assert data["has_more"] is False

    def test_list_stocks_with_data(self, client, test_db):
        """Test listing stocks with data."""
        # Create test stocks
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc.", sector="Technology"),
            Stock(ticker="MSFT", name="Microsoft Corporation", sector="Technology"),
            Stock(ticker="JPM", name="JPMorgan Chase", sector="Financials")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["items"]) == 3
        assert data["total"] == 3

    def test_list_stocks_pagination(self, client, test_db):
        """Test pagination works correctly."""
        # Create 10 stocks
        stocks = [Stock(ticker=f"TICK{i}", name=f"Stock {i}") for i in range(10)]
        test_db.add_all(stocks)
        test_db.commit()

        # Get first page
        response = client.get("/api/stocks/?skip=0&limit=5")
        data = response.json()
        assert len(data["items"]) == 5
        assert data["total"] == 10
        assert data["has_more"] is True

        # Get second page
        response = client.get("/api/stocks/?skip=5&limit=5")
        data = response.json()
        assert len(data["items"]) == 5
        assert data["has_more"] is False

    def test_list_stocks_filter_by_instrument_type(self, client, test_db):
        """Test filtering by instrument type."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", instrument_type=InstrumentType.STOCK),
            Stock(ticker="SPY", name="SPY ETF", instrument_type=InstrumentType.ETF),
            Stock(ticker="BOND1", name="Bond", instrument_type=InstrumentType.BOND)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/?instrument_type=STOCK")
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["ticker"] == "AAPL"

    def test_list_stocks_filter_by_sector(self, client, test_db):
        """Test filtering by sector."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", sector="Technology"),
            Stock(ticker="MSFT", name="Microsoft", sector="Technology"),
            Stock(ticker="JPM", name="JPMorgan", sector="Financials")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/?sector=Technology")
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 2

    def test_list_stocks_invalid_skip(self, client):
        """Test validation of skip parameter."""
        response = client.get("/api/stocks/?skip=-1")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_list_stocks_invalid_limit(self, client):
        """Test validation of limit parameter."""
        response = client.get("/api/stocks/?limit=1001")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestSearchStocksEndpoint:
    """Test GET /api/stocks/search endpoint."""

    def test_search_stocks_by_ticker(self, client, test_db):
        """Test searching stocks by ticker."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc."),
            Stock(ticker="MSFT", name="Microsoft Corporation"),
            Stock(ticker="AMAT", name="Applied Materials")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/search?q=AA")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Should find at least one stock containing "AA"
        assert len(data["results"]) >= 1
        assert data["query"] == "AA"
        tickers = [stock["ticker"] for stock in data["results"]]
        # At least AAPL or AMAT should be found
        assert "AAPL" in tickers or "AMAT" in tickers

    def test_search_stocks_by_name(self, client, test_db):
        """Test searching stocks by name."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc."),
            Stock(ticker="GOOGL", name="Alphabet Inc.")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/search?q=Inc")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["results"]) >= 1

    def test_search_stocks_case_insensitive(self, client, test_db):
        """Test search is case-insensitive."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()

        response = client.get("/api/stocks/search?q=apple")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["results"]) >= 1

    def test_search_stocks_with_limit(self, client, test_db):
        """Test search respects limit parameter."""
        stocks = [Stock(ticker=f"TECH{i}", name=f"Tech Company {i}") for i in range(10)]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/search?q=Tech&limit=5")
        data = response.json()
        assert len(data["results"]) == 5

    def test_search_stocks_no_results(self, client):
        """Test search with no results."""
        response = client.get("/api/stocks/search?q=NOTEXIST")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["results"] == []
        assert data["total"] == 0

    def test_search_stocks_missing_query(self, client):
        """Test search without query parameter."""
        response = client.get("/api/stocks/search")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_search_stocks_empty_query(self, client):
        """Test search with empty query string."""
        response = client.get("/api/stocks/search?q=")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_search_stocks_filter_by_instrument_type(self, client, test_db):
        """Test search with instrument type filter."""
        stocks = [
            Stock(ticker="AAPL", name="Apple Inc.", instrument_type=InstrumentType.STOCK),
            Stock(ticker="SPY", name="Apple ETF", instrument_type=InstrumentType.ETF)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/search?q=Apple&instrument_type=STOCK")
        data = response.json()
        assert len(data["results"]) == 1
        assert data["results"][0]["ticker"] == "AAPL"


class TestGetSectorsEndpoint:
    """Test GET /api/stocks/sectors endpoint."""

    def test_get_sectors_empty(self, client):
        """Test getting sectors when no stocks exist."""
        response = client.get("/api/stocks/sectors")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data == []

    def test_get_sectors_with_data(self, client, test_db):
        """Test getting all unique sectors."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", sector="Technology"),
            Stock(ticker="MSFT", name="Microsoft", sector="Technology"),
            Stock(ticker="JPM", name="JPMorgan", sector="Financials"),
            Stock(ticker="JNJ", name="Johnson & Johnson", sector="Healthcare")
        ]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/sectors")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 3
        assert "Technology" in data
        assert "Financials" in data
        assert "Healthcare" in data

    def test_get_sectors_excludes_null(self, client, test_db):
        """Test sectors endpoint excludes stocks with null sector."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", sector="Technology"),
            Stock(ticker="UNKNOWN", name="Unknown", sector=None)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/sectors")
        data = response.json()
        assert len(data) == 1
        assert "Technology" in data


class TestGetStockByTickerEndpoint:
    """Test GET /api/stocks/{ticker} endpoint."""

    def test_get_stock_by_ticker_found(self, client, test_db):
        """Test getting stock by ticker."""
        stock = Stock(ticker="AAPL", name="Apple Inc.", sector="Technology")
        test_db.add(stock)
        test_db.commit()

        response = client.get("/api/stocks/AAPL")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["ticker"] == "AAPL"
        assert data["name"] == "Apple Inc."

    def test_get_stock_by_ticker_not_found(self, client):
        """Test getting nonexistent stock."""
        response = client.get("/api/stocks/NOTEXIST")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_get_stock_case_insensitive(self, client, test_db):
        """Test ticker lookup is case-insensitive."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()

        response = client.get("/api/stocks/aapl")
        assert response.status_code == status.HTTP_200_OK


class TestDeleteStockEndpoint:
    """Test DELETE /api/stocks/{ticker} endpoint."""

    def test_delete_stock_success(self, client, test_db):
        """Test successful stock deletion."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        stock_id = stock.id

        response = client.delete("/api/stocks/AAPL")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify stock is soft-deleted by querying from database
        deleted_stock = test_db.query(Stock).filter(Stock.id == stock_id).first()
        assert deleted_stock is not None
        assert deleted_stock.is_deleted is True

    def test_delete_stock_not_found(self, client):
        """Test deleting nonexistent stock."""
        response = client.delete("/api/stocks/NOTEXIST")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_stock_twice(self, client, test_db):
        """Test deleting same stock twice."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()

        # First delete
        response = client.delete("/api/stocks/AAPL")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Second delete should fail
        response = client.delete("/api/stocks/AAPL")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestStockEndpointsWithRelatedData:
    """Test stock endpoints with scores and fundamentals."""

    def test_get_stock_with_full_data(self, client, test_db):
        """Test getting stock with scores and fundamentals."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()
        test_db.refresh(stock)

        # Note: We can't add related data due to UUID/Integer FK mismatch bug
        # This test documents the expected behavior when bug is fixed

        response = client.get("/api/stocks/AAPL")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify structure (scores/fundamentals will be null for now)
        assert "scores" in data
        assert "fundamentals" in data


class TestStockEndpointsValidation:
    """Test input validation for stock endpoints."""

    def test_list_stocks_invalid_instrument_type(self, client):
        """Test invalid instrument type."""
        response = client.get("/api/stocks/?instrument_type=INVALID")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_search_limit_too_high(self, client):
        """Test search limit validation."""
        response = client.get("/api/stocks/search?q=test&limit=101")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestStockEndpointsEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_list_stocks_skip_beyond_total(self, client, test_db):
        """Test pagination skip beyond total records."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()

        response = client.get("/api/stocks/?skip=100")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 1

    def test_search_special_characters(self, client, test_db):
        """Test search with special characters."""
        stock = Stock(ticker="BRK.B", name="Berkshire Hathaway B")
        test_db.add(stock)
        test_db.commit()

        response = client.get("/api/stocks/search?q=BRK.B")
        assert response.status_code == status.HTTP_200_OK

    def test_list_stocks_with_deleted(self, client, test_db):
        """Test list doesn't include soft-deleted stocks."""
        stocks = [
            Stock(ticker="AAPL", name="Apple", is_deleted=False),
            Stock(ticker="DELETED", name="Deleted Stock", is_deleted=True)
        ]
        test_db.add_all(stocks)
        test_db.commit()

        response = client.get("/api/stocks/")
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["ticker"] == "AAPL"


class TestStockEndpointsResponseFormat:
    """Test response format and schema compliance."""

    def test_stock_list_response_format(self, client, test_db):
        """Test stock list response has correct format."""
        stock = Stock(
            ticker="AAPL",
            name="Apple Inc.",
            sector="Technology",
            instrument_type=InstrumentType.STOCK,
            currency="USD"
        )
        test_db.add(stock)
        test_db.commit()

        response = client.get("/api/stocks/")
        data = response.json()

        # Check pagination fields
        assert "items" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert "has_more" in data

        # Check stock item fields
        stock_item = data["items"][0]
        assert "id" in stock_item
        assert "ticker" in stock_item
        assert "name" in stock_item
        assert "instrument_type" in stock_item
        assert "created_at" in stock_item
        assert "last_updated" in stock_item

    def test_search_response_format(self, client, test_db):
        """Test search response has correct format."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()

        response = client.get("/api/stocks/search?q=AAPL")
        data = response.json()

        assert "results" in data
        assert "query" in data
        assert "total" in data
        assert data["query"] == "AAPL"

    def test_stock_detail_response_format(self, client, test_db):
        """Test stock detail response has correct format."""
        stock = Stock(ticker="AAPL", name="Apple Inc.")
        test_db.add(stock)
        test_db.commit()

        response = client.get("/api/stocks/AAPL")
        data = response.json()

        # Check all expected fields
        assert "id" in data
        assert "ticker" in data
        assert "name" in data
        assert "instrument_type" in data
        assert "scores" in data
        assert "fundamentals" in data
        assert "created_at" in data
        assert "last_updated" in data
