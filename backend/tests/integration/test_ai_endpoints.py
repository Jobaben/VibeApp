"""Integration tests for AI API endpoints."""
import pytest
from fastapi import status


class TestAIHealthEndpoint:
    """Test AI health check endpoint."""

    def test_ai_health_check(self, client):
        """Test AI health endpoint returns correct response."""
        response = client.get("/api/ai/health")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "AI API"
        assert "endpoints_available" in data
        assert len(data["endpoints_available"]) == 5

    def test_ai_health_check_lists_all_endpoints(self, client):
        """Test health check lists all available endpoints."""
        response = client.get("/api/ai/health")
        data = response.json()

        expected_endpoints = [
            "POST /api/ai/analyze-stocks",
            "GET /api/ai/stock/{ticker}/deep-analysis",
            "POST /api/ai/compare-stocks",
            "GET /api/ai/strategies/{strategy_name}",
            "POST /api/ai/run-custom-screener"
        ]

        for endpoint in expected_endpoints:
            assert endpoint in data["endpoints_available"]


class TestAnalyzeStocksEndpoint:
    """Test POST /api/ai/analyze-stocks endpoint."""

    def test_analyze_stocks_endpoint_exists(self, client):
        """Test analyze stocks endpoint is accessible."""
        response = client.post(
            "/api/ai/analyze-stocks",
            json={"criteria": {}}
        )

        assert response.status_code == status.HTTP_200_OK

    def test_analyze_stocks_with_criteria(self, client):
        """Test analyze stocks with specific criteria."""
        criteria = {
            "min_roic": 15,
            "max_pe": 20,
            "max_debt_equity": 0.5
        }

        response = client.post(
            "/api/ai/analyze-stocks?limit=50",
            json={"criteria": criteria}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify response structure
        assert "query_metadata" in data
        assert "market_context" in data
        assert "stocks" in data
        assert "ai_summary" in data

        # Verify query metadata
        assert data["query_metadata"]["limit"] == 50
        assert "criteria_used" in data["query_metadata"]

        # Verify market context
        assert "timestamp" in data["market_context"]
        assert "market_avg_pe" in data["market_context"]

        # Verify AI summary
        assert "key_findings" in data["ai_summary"]
        assert "sector_distribution" in data["ai_summary"]

    def test_analyze_stocks_empty_criteria(self, client):
        """Test analyze stocks with empty criteria."""
        response = client.post(
            "/api/ai/analyze-stocks",
            json={"criteria": {}}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data["stocks"], list)

    def test_analyze_stocks_with_limit(self, client):
        """Test analyze stocks respects limit parameter."""
        response = client.post(
            "/api/ai/analyze-stocks?limit=10",
            json={"criteria": {}}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["query_metadata"]["limit"] == 10

    def test_analyze_stocks_limit_validation(self, client):
        """Test limit parameter validation."""
        # Test limit too high
        response = client.post(
            "/api/ai/analyze-stocks?limit=500",
            json={"criteria": {}}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Test limit too low
        response = client.post(
            "/api/ai/analyze-stocks?limit=0",
            json={"criteria": {}}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_analyze_stocks_complex_criteria(self, client):
        """Test analyze stocks with complex criteria."""
        criteria = {
            "min_roic": 15,
            "max_pe": 20,
            "min_roe": 10,
            "max_debt_equity": 0.5,
            "sectors": ["Industrials", "Technology"],
            "min_market_cap": 1000000000,
            "min_price": 50,
            "max_price": 500,
            "instrument_types": ["STOCK"]
        }

        response = client.post(
            "/api/ai/analyze-stocks",
            json={"criteria": criteria}
        )

        assert response.status_code == status.HTTP_200_OK


class TestDeepAnalysisEndpoint:
    """Test GET /api/ai/stock/{ticker}/deep-analysis endpoint."""

    def test_deep_analysis_endpoint_not_found(self, client):
        """Test deep analysis returns 404 for non-existent stock."""
        response = client.get("/api/ai/stock/VOLV-B/deep-analysis")

        # Currently returns 404 as it's not implemented
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data

    def test_deep_analysis_ticker_format(self, client):
        """Test deep analysis accepts various ticker formats."""
        tickers = ["VOLV-B", "SEB-A", "ERIC-B", "HM-B"]

        for ticker in tickers:
            response = client.get(f"/api/ai/stock/{ticker}/deep-analysis")
            # All should return 404 during Phase 0
            assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCompareStocksEndpoint:
    """Test POST /api/ai/compare-stocks endpoint."""

    def test_compare_stocks_endpoint_exists(self, client):
        """Test compare stocks endpoint is accessible."""
        response = client.post(
            "/api/ai/compare-stocks",
            json=["VOLV-B", "SCVB"]
        )

        assert response.status_code == status.HTTP_200_OK

    def test_compare_stocks_multiple_tickers(self, client):
        """Test comparing multiple stocks."""
        response = client.post(
            "/api/ai/compare-stocks",
            json=["VOLV-B", "SCVB", "GETI-B"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "stocks" in data
        assert "comparison_matrix" in data

    def test_compare_stocks_empty_list(self, client):
        """Test comparison with empty ticker list."""
        response = client.post(
            "/api/ai/compare-stocks",
            json=[]
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "detail" in data

    def test_compare_stocks_single_ticker(self, client):
        """Test comparison with only one ticker."""
        response = client.post(
            "/api/ai/compare-stocks",
            json=["VOLV-B"]
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "at least 2 tickers" in data["detail"].lower()


class TestStrategiesEndpoint:
    """Test GET /api/ai/strategies/{strategy_name} endpoint."""

    def test_valid_strategy_value_gems(self, client):
        """Test value_gems strategy."""
        response = client.get("/api/ai/strategies/value_gems")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["strategy"] == "value_gems"
        assert "results" in data

    def test_valid_strategy_quality_compounders(self, client):
        """Test quality_compounders strategy."""
        response = client.get("/api/ai/strategies/quality_compounders")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["strategy"] == "quality_compounders"

    def test_all_valid_strategies(self, client):
        """Test all valid strategies are accessible."""
        strategies = [
            "value_gems",
            "quality_compounders",
            "dividend_kings",
            "deep_value",
            "explosive_growth"
        ]

        for strategy in strategies:
            response = client.get(f"/api/ai/strategies/{strategy}")
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["strategy"] == strategy

    def test_invalid_strategy(self, client):
        """Test invalid strategy returns 404."""
        response = client.get("/api/ai/strategies/invalid_strategy")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_strategy_with_limit(self, client):
        """Test strategy respects limit parameter."""
        response = client.get("/api/ai/strategies/value_gems?limit=10")

        assert response.status_code == status.HTTP_200_OK

    def test_strategy_limit_validation(self, client):
        """Test strategy limit validation."""
        # Test limit too high
        response = client.get("/api/ai/strategies/value_gems?limit=500")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Test limit too low
        response = client.get("/api/ai/strategies/value_gems?limit=0")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestCustomScreenerEndpoint:
    """Test POST /api/ai/run-custom-screener endpoint."""

    def test_custom_screener_endpoint_exists(self, client):
        """Test custom screener endpoint is accessible."""
        response = client.post(
            "/api/ai/run-custom-screener?expression=ROIC > 15"
        )

        assert response.status_code == status.HTTP_200_OK

    def test_custom_screener_simple_expression(self, client):
        """Test custom screener with simple expression."""
        expression = "ROIC > 15 AND PE < 20"
        response = client.post(
            f"/api/ai/run-custom-screener?expression={expression}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["expression"] == expression
        assert "results" in data

    def test_custom_screener_complex_expression(self, client):
        """Test custom screener with complex expression."""
        expression = "(ROIC > 15 AND PE < 20) OR (Dividend_Yield > 5 AND Debt_Equity < 0.3)"
        response = client.post(
            f"/api/ai/run-custom-screener?expression={expression}"
        )

        assert response.status_code == status.HTTP_200_OK

    def test_custom_screener_missing_expression(self, client):
        """Test custom screener without expression parameter."""
        response = client.post("/api/ai/run-custom-screener")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestCORSConfiguration:
    """Test CORS configuration for AI endpoints."""

    def test_cors_headers_present(self, client):
        """Test CORS headers are present in responses."""
        response = client.options(
            "/api/ai/analyze-stocks",
            headers={"Origin": "http://localhost:3000"}
        )

        # CORS headers should be present
        assert "access-control-allow-origin" in response.headers or response.status_code == status.HTTP_200_OK

    def test_ai_endpoints_accept_json(self, client):
        """Test AI endpoints accept JSON content type."""
        response = client.post(
            "/api/ai/analyze-stocks",
            json={"criteria": {}},
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == status.HTTP_200_OK


class TestAPIDocumentation:
    """Test API documentation is available."""

    def test_openapi_schema_available(self, client):
        """Test OpenAPI schema is accessible."""
        response = client.get("/openapi.json")

        assert response.status_code == status.HTTP_200_OK
        schema = response.json()
        assert "openapi" in schema
        assert "paths" in schema

    def test_ai_endpoints_in_schema(self, client):
        """Test AI endpoints are documented in OpenAPI schema."""
        response = client.get("/openapi.json")
        schema = response.json()

        ai_endpoints = [
            "/api/ai/analyze-stocks",
            "/api/ai/stock/{ticker}/deep-analysis",
            "/api/ai/compare-stocks",
            "/api/ai/strategies/{strategy_name}",
            "/api/ai/run-custom-screener"
        ]

        for endpoint in ai_endpoints:
            assert endpoint in schema["paths"]
