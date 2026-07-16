"""Integration tests for the X-Admin-Token guard on mutating admin endpoints."""
from fastapi import status

from app import config


class TestAdminGuardDevOpen:
    """With no ADMIN_API_KEY in development, admin endpoints stay open."""

    def test_scores_calculate_open_in_dev(self, client, monkeypatch):
        monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "")
        monkeypatch.setattr(config.settings, "ENVIRONMENT", "development")

        response = client.post("/api/stocks/scores/calculate")
        assert response.status_code == status.HTTP_200_OK

    def test_cache_invalidate_open_in_dev(self, client, monkeypatch):
        monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "")
        monkeypatch.setattr(config.settings, "ENVIRONMENT", "development")

        response = client.post("/api/cache/invalidate?pattern=stocks:*")
        assert response.status_code == status.HTTP_200_OK


class TestAdminGuardWithKey:
    """With ADMIN_API_KEY configured, a matching header is required."""

    def test_missing_token_rejected(self, client, monkeypatch):
        monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "test-admin-key")

        response = client.post("/api/stocks/scores/calculate")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_wrong_token_rejected(self, client, monkeypatch):
        monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "test-admin-key")

        response = client.post(
            "/api/stocks/scores/calculate",
            headers={"X-Admin-Token": "wrong-key"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_correct_token_accepted(self, client, monkeypatch):
        monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "test-admin-key")

        response = client.post(
            "/api/stocks/scores/calculate",
            headers={"X-Admin-Token": "test-admin-key"},
        )
        assert response.status_code == status.HTTP_200_OK

    def test_cache_delete_key_requires_token(self, client, monkeypatch):
        monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "test-admin-key")

        response = client.delete("/api/cache/key/some-key")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAdminGuardProductionWithoutKey:
    """In production without ADMIN_API_KEY, admin endpoints are disabled."""

    def test_returns_503(self, client, monkeypatch):
        monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "")
        monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")

        response = client.post("/api/stocks/scores/calculate")
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


class TestReadOnlyEndpointsStayOpen:
    """Read-only endpoints must not require the admin token."""

    def test_cache_status_open(self, client, monkeypatch):
        monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "test-admin-key")

        response = client.get("/api/cache/status")
        assert response.status_code == status.HTTP_200_OK

    def test_stock_list_open(self, client, monkeypatch):
        monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "test-admin-key")

        response = client.get("/api/stocks/")
        assert response.status_code == status.HTTP_200_OK
