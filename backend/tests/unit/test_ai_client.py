"""Unit tests for AI Client Library."""
import pytest
from unittest.mock import Mock, patch, MagicMock
import pandas as pd
import requests

from app.ai_client.client import AvanzaAIClient, get_client


class TestAvanzaAIClientInitialization:
    """Test client initialization and setup."""

    def test_client_initialization_default_url(self):
        """Test client initializes with default URL."""
        client = AvanzaAIClient()
        assert client.base_url == "http://localhost:8000"
        assert client.session is not None
        assert client.session.headers["Content-Type"] == "application/json"
        assert "AvanzaAIClient" in client.session.headers["User-Agent"]

    def test_client_initialization_custom_url(self):
        """Test client initializes with custom URL."""
        custom_url = "http://custom-host:9000"
        client = AvanzaAIClient(base_url=custom_url)
        assert client.base_url == custom_url

    def test_client_initialization_strips_trailing_slash(self):
        """Test client strips trailing slash from URL."""
        client = AvanzaAIClient(base_url="http://localhost:8000/")
        assert client.base_url == "http://localhost:8000"

    def test_get_client_convenience_function(self):
        """Test get_client convenience function."""
        client = get_client()
        assert isinstance(client, AvanzaAIClient)
        assert client.base_url == "http://localhost:8000"

    def test_get_client_with_custom_url(self):
        """Test get_client with custom URL."""
        custom_url = "http://example.com:8080"
        client = get_client(base_url=custom_url)
        assert client.base_url == custom_url


class TestHealthCheck:
    """Test health check functionality."""

    @patch('app.ai_client.client.requests.Session.get')
    def test_health_check_success(self, mock_get):
        """Test successful health check."""
        mock_response = Mock()
        mock_response.json.return_value = {"status": "healthy", "service": "Backend API"}
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = AvanzaAIClient()
        result = client.health_check()

        assert result["status"] == "healthy"
        assert result["service"] == "Backend API"
        mock_get.assert_called_once_with("http://localhost:8000/health")

    @patch('app.ai_client.client.requests.Session.get')
    def test_health_check_failure(self, mock_get):
        """Test health check handles connection failure."""
        mock_get.side_effect = requests.exceptions.ConnectionError("Connection refused")

        client = AvanzaAIClient()
        result = client.health_check()

        assert result["status"] == "unhealthy"
        assert "error" in result

    @patch('app.ai_client.client.requests.Session.get')
    def test_health_check_http_error(self, mock_get):
        """Test health check handles HTTP errors."""
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("500 Server Error")
        mock_get.return_value = mock_response

        client = AvanzaAIClient()
        result = client.health_check()

        assert result["status"] == "unhealthy"
        assert "error" in result


class TestAnalyzeStocks:
    """Test stock analysis functionality."""

    @patch('app.ai_client.client.requests.Session.post')
    def test_analyze_stocks_with_criteria(self, mock_post):
        """Test analyze_stocks with specific criteria."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "stocks": [
                {
                    "ticker": "VOLV-B",
                    "name": "Volvo Group",
                    "price": 245.50,
                    "sector": "Industrials",
                    "industry": "Commercial Vehicles",
                    "signal": "BUY",
                    "scores": {
                        "total": 82,
                        "value": 20,
                        "quality": 22,
                        "momentum": 18,
                        "health": 22
                    },
                    "fundamentals": {
                        "pe_ratio": 12.5,
                        "roic": 18.5,
                        "roe": 22.3,
                        "debt_equity": 0.45
                    },
                    "vs_sector": {
                        "pe_percentile": 65,
                        "roic_percentile": 78
                    }
                }
            ]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        client = AvanzaAIClient()
        criteria = {"min_roic": 15, "max_pe": 20}
        result = client.analyze_stocks(criteria, limit=50)

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 1
        assert result.iloc[0]["ticker"] == "VOLV-B"
        assert result.iloc[0]["total_score"] == 82
        assert result.iloc[0]["roic"] == 18.5

    @patch('app.ai_client.client.requests.Session.post')
    def test_analyze_stocks_empty_result(self, mock_post):
        """Test analyze_stocks with no results."""
        mock_response = Mock()
        mock_response.json.return_value = {"stocks": []}
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        client = AvanzaAIClient()
        result = client.analyze_stocks({"min_roic": 100})

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0

    @patch('app.ai_client.client.requests.Session.post')
    def test_analyze_stocks_no_criteria(self, mock_post):
        """Test analyze_stocks with no criteria (all stocks)."""
        mock_response = Mock()
        mock_response.json.return_value = {"stocks": []}
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        client = AvanzaAIClient()
        result = client.analyze_stocks()

        assert isinstance(result, pd.DataFrame)
        mock_post.assert_called_once()

    @patch('app.ai_client.client.requests.Session.post')
    def test_analyze_stocks_request_exception(self, mock_post):
        """Test analyze_stocks handles request exceptions."""
        mock_post.side_effect = requests.exceptions.RequestException("Network error")

        client = AvanzaAIClient()
        result = client.analyze_stocks({"min_roic": 15})

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0


class TestGetTopStocks:
    """Test pre-built strategy functionality."""

    @patch('app.ai_client.client.requests.Session.get')
    def test_get_top_stocks_value_gems(self, mock_get):
        """Test getting value gems strategy results."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "results": [
                {"ticker": "VOLV-B", "score": 85},
                {"ticker": "SCVB", "score": 82}
            ]
        }
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = AvanzaAIClient()
        result = client.get_top_stocks("value_gems", limit=20)

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 2
        mock_get.assert_called_once()

    @patch('app.ai_client.client.requests.Session.get')
    def test_get_top_stocks_empty_result(self, mock_get):
        """Test strategy with no results."""
        mock_response = Mock()
        mock_response.json.return_value = {"results": []}
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = AvanzaAIClient()
        result = client.get_top_stocks("dividend_kings")

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0

    @patch('app.ai_client.client.requests.Session.get')
    def test_get_top_stocks_request_exception(self, mock_get):
        """Test strategy handles request exceptions."""
        mock_get.side_effect = requests.exceptions.RequestException("Network error")

        client = AvanzaAIClient()
        result = client.get_top_stocks("quality_compounders")

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0


class TestDeepDive:
    """Test deep dive analysis functionality."""

    @patch('app.ai_client.client.requests.Session.get')
    def test_deep_dive_success(self, mock_get):
        """Test successful deep dive analysis."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "stock": {
                "ticker": "VOLV-B",
                "name": "Volvo Group",
                "scores": {"total": 82},
                "ai_insights": {
                    "strengths": ["Strong ROIC"],
                    "weaknesses": ["High P/E"],
                    "catalyst_watch": []
                }
            },
            "historical_trends": {
                "roic_history": [15.2, 16.8, 18.5]
            }
        }
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = AvanzaAIClient()
        result = client.deep_dive("VOLV-B")

        assert isinstance(result, dict)
        assert result["stock"]["ticker"] == "VOLV-B"
        assert "historical_trends" in result
        mock_get.assert_called_once_with("http://localhost:8000/api/ai/stock/VOLV-B/deep-analysis")

    @patch('app.ai_client.client.requests.Session.get')
    def test_deep_dive_not_found(self, mock_get):
        """Test deep dive on non-existent stock."""
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("404 Not Found")
        mock_get.return_value = mock_response

        client = AvanzaAIClient()
        result = client.deep_dive("INVALID-TICKER")

        assert isinstance(result, dict)
        assert len(result) == 0

    @patch('app.ai_client.client.requests.Session.get')
    def test_deep_dive_request_exception(self, mock_get):
        """Test deep dive handles request exceptions."""
        mock_get.side_effect = requests.exceptions.RequestException("Network error")

        client = AvanzaAIClient()
        result = client.deep_dive("VOLV-B")

        assert isinstance(result, dict)
        assert len(result) == 0


class TestCompare:
    """Test stock comparison functionality."""

    @patch('app.ai_client.client.requests.Session.post')
    def test_compare_multiple_stocks(self, mock_post):
        """Test comparing multiple stocks."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "stocks": [
                {
                    "ticker": "VOLV-B",
                    "name": "Volvo Group",
                    "price": 245.50,
                    "sector": "Industrials",
                    "signal": "BUY",
                    "scores": {"total": 82, "value": 20, "quality": 22, "momentum": 18, "health": 22},
                    "fundamentals": {"pe_ratio": 12.5, "roic": 18.5}
                },
                {
                    "ticker": "SCVB",
                    "name": "Scania",
                    "price": 180.25,
                    "sector": "Industrials",
                    "signal": "HOLD",
                    "scores": {"total": 75, "value": 18, "quality": 20, "momentum": 17, "health": 20},
                    "fundamentals": {"pe_ratio": 14.2, "roic": 16.8}
                }
            ]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        client = AvanzaAIClient()
        result = client.compare(["VOLV-B", "SCVB"])

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 2
        assert list(result["ticker"]) == ["VOLV-B", "SCVB"]
        assert "total_score" in result.columns
        assert "roic" in result.columns

    @patch('app.ai_client.client.requests.Session.post')
    def test_compare_empty_result(self, mock_post):
        """Test comparison with no results."""
        mock_response = Mock()
        mock_response.json.return_value = {"stocks": []}
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        client = AvanzaAIClient()
        result = client.compare(["INVALID1", "INVALID2"])

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0

    @patch('app.ai_client.client.requests.Session.post')
    def test_compare_request_exception(self, mock_post):
        """Test comparison handles request exceptions."""
        mock_post.side_effect = requests.exceptions.RequestException("Network error")

        client = AvanzaAIClient()
        result = client.compare(["VOLV-B", "SCVB"])

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0


class TestRunCustomScreener:
    """Test custom screener functionality."""

    @patch('app.ai_client.client.requests.Session.post')
    def test_run_custom_screener_success(self, mock_post):
        """Test running custom screener with expression."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "results": [
                {"ticker": "VOLV-B", "roic": 18.5, "pe_ratio": 12.5},
                {"ticker": "SCVB", "roic": 16.8, "pe_ratio": 14.2}
            ]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        client = AvanzaAIClient()
        result = client.run_custom_screener("ROIC > 15 AND PE < 20")

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 2

    @patch('app.ai_client.client.requests.Session.post')
    def test_run_custom_screener_empty_result(self, mock_post):
        """Test custom screener with no results."""
        mock_response = Mock()
        mock_response.json.return_value = {"results": []}
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        client = AvanzaAIClient()
        result = client.run_custom_screener("ROIC > 100")

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0

    @patch('app.ai_client.client.requests.Session.post')
    def test_run_custom_screener_request_exception(self, mock_post):
        """Test custom screener handles request exceptions."""
        mock_post.side_effect = requests.exceptions.RequestException("Network error")

        client = AvanzaAIClient()
        result = client.run_custom_screener("ROIC > 15")

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0


class TestGetSectorLeaders:
    """Test sector leaders functionality."""

    @patch('app.ai_client.client.AvanzaAIClient.analyze_stocks')
    def test_get_sector_leaders_success(self, mock_analyze):
        """Test getting sector leaders."""
        # Create mock DataFrame
        mock_df = pd.DataFrame([
            {"ticker": "VOLV-B", "sector": "Industrials", "total_score": 85},
            {"ticker": "SCVB", "sector": "Industrials", "total_score": 82},
            {"ticker": "GETI-B", "sector": "Industrials", "total_score": 78},
            {"ticker": "SKF-B", "sector": "Industrials", "total_score": 75},
        ])
        mock_analyze.return_value = mock_df

        client = AvanzaAIClient()
        result = client.get_sector_leaders("Industrials", top_n=3)

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 3
        assert list(result["ticker"]) == ["VOLV-B", "SCVB", "GETI-B"]
        mock_analyze.assert_called_once_with({"sectors": ["Industrials"]}, limit=100)

    @patch('app.ai_client.client.AvanzaAIClient.analyze_stocks')
    def test_get_sector_leaders_empty_result(self, mock_analyze):
        """Test sector leaders with no results."""
        mock_analyze.return_value = pd.DataFrame()

        client = AvanzaAIClient()
        result = client.get_sector_leaders("NonExistentSector")

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 0

    @patch('app.ai_client.client.AvanzaAIClient.analyze_stocks')
    def test_get_sector_leaders_fewer_than_requested(self, mock_analyze):
        """Test sector leaders when fewer stocks available than requested."""
        mock_df = pd.DataFrame([
            {"ticker": "VOLV-B", "sector": "Industrials", "total_score": 85},
            {"ticker": "SCVB", "sector": "Industrials", "total_score": 82}
        ])
        mock_analyze.return_value = mock_df

        client = AvanzaAIClient()
        result = client.get_sector_leaders("Industrials", top_n=10)

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 2  # Only 2 available, not 10
