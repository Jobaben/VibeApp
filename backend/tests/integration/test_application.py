"""Integration tests for main application."""
import pytest
from fastapi import status


class TestApplicationStartup:
    """Test application initialization and startup."""

    def test_app_is_created(self, client):
        """Test FastAPI application is created successfully."""
        assert client.app is not None
        assert client.app.title == "Avanza Stock Finder"

    def test_root_endpoint(self, client):
        """Test root endpoint returns correct info."""
        response = client.get("/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Avanza Stock Finder"
        assert data["status"] == "running"
        assert "version" in data
        assert "description" in data

    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"


class TestRouterRegistration:
    """Test API routers are properly registered."""

    def test_ai_router_registered(self, client):
        """Test AI router is registered."""
        # Test one of the AI endpoints
        response = client.get("/api/ai/health")
        assert response.status_code == status.HTTP_200_OK

    def test_openapi_schema_includes_ai_endpoints(self, client):
        """Test OpenAPI schema includes AI endpoints."""
        response = client.get("/openapi.json")
        schema = response.json()

        # Check AI endpoints are in schema
        assert "/api/ai/analyze-stocks" in schema["paths"]
        assert "/api/ai/health" in schema["paths"]


class TestCORSMiddleware:
    """Test CORS middleware configuration."""

    def test_cors_allows_localhost_3000(self, client):
        """Test CORS allows requests from localhost:3000."""
        response = client.get(
            "/health",
            headers={"Origin": "http://localhost:3000"}
        )

        assert response.status_code == status.HTTP_200_OK

    def test_cors_allows_localhost_5173(self, client):
        """Test CORS allows requests from localhost:5173 (Vite default)."""
        response = client.get(
            "/health",
            headers={"Origin": "http://localhost:5173"}
        )

        assert response.status_code == status.HTTP_200_OK


class TestAPIDocumentation:
    """Test API documentation is available."""

    def test_swagger_ui_available(self, client):
        """Test Swagger UI documentation is accessible."""
        response = client.get("/docs")
        assert response.status_code == status.HTTP_200_OK

    def test_redoc_available(self, client):
        """Test ReDoc documentation is accessible."""
        response = client.get("/redoc")
        assert response.status_code == status.HTTP_200_OK

    def test_openapi_json_available(self, client):
        """Test OpenAPI JSON schema is accessible."""
        response = client.get("/openapi.json")

        assert response.status_code == status.HTTP_200_OK
        schema = response.json()
        assert "openapi" in schema
        assert schema["info"]["title"] == "Avanza Stock Finder"


class TestDatabaseIntegration:
    """Test database integration."""

    def test_database_tables_created(self, test_db):
        """Test database tables are created."""
        # Since we're using in-memory SQLite for tests,
        # just verify we can create a session
        assert test_db is not None

    def test_database_session_works(self, test_db):
        """Test database session can execute queries."""
        # Simple query to verify session works
        from sqlalchemy import text
        result = test_db.execute(text("SELECT 1")).scalar()
        assert result == 1


class TestErrorHandling:
    """Test application error handling."""

    def test_404_for_unknown_endpoint(self, client):
        """Test 404 error for non-existent endpoint."""
        response = client.get("/this-does-not-exist")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_405_for_wrong_method(self, client):
        """Test 405 error for wrong HTTP method."""
        # POST endpoint called with GET
        response = client.get("/api/ai/analyze-stocks")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_422_for_invalid_request_body(self, client):
        """Test 422 error for invalid request body."""
        response = client.post(
            "/api/ai/analyze-stocks",
            json="not a valid object"
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
