"""Avanza API client for fetching stock data."""
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
import time

from app.config import settings

logger = logging.getLogger(__name__)


class AvanzaClient:
    """
    Client for interacting with Avanza API.

    Note: The Avanza API requires authentication with 2FA.
    For MVP, this client provides a structure for future integration.
    Currently supports fetching public data and can be extended with authentication.
    """

    def __init__(
        self,
        username: Optional[str] = None,
        password: Optional[str] = None,
        totp_secret: Optional[str] = None,
    ):
        """
        Initialize Avanza client.

        Args:
            username: Avanza username (optional for now)
            password: Avanza password (optional for now)
            totp_secret: TOTP secret for 2FA (optional for now)
        """
        self.username = username
        self.password = password
        self.totp_secret = totp_secret
        self._client = None
        self._authenticated = False
        self._last_request_time = 0
        self._min_request_interval = 0.5  # Rate limiting: 0.5 seconds between requests

    def _rate_limit(self):
        """Implement rate limiting to avoid overwhelming the API."""
        current_time = time.time()
        time_since_last_request = current_time - self._last_request_time
        if time_since_last_request < self._min_request_interval:
            time.sleep(self._min_request_interval - time_since_last_request)
        self._last_request_time = time.time()

    async def authenticate(self) -> bool:
        """
        Authenticate with Avanza API.

        Returns:
            bool: True if authentication successful, False otherwise
        """
        if not all([self.username, self.password, self.totp_secret]):
            logger.warning("Avanza credentials not provided. Running in mock mode.")
            return False

        try:
            # Import here to make it optional
            from avanza import Avanza

            self._client = Avanza()
            # Note: Authentication requires async handling
            # This is a placeholder for future implementation
            logger.info("Avanza authentication not yet implemented.")
            return False

        except ImportError:
            logger.error("avanza-api package not installed. Run: pip install avanza-api")
            return False
        except Exception as e:
            logger.error(f"Failed to authenticate with Avanza: {e}")
            return False

    def get_stock_list(
        self,
        instrument_type: str = "STOCK",
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Fetch list of stocks from Avanza.

        Args:
            instrument_type: Type of instrument (STOCK, FUND, ETF, etc.)
            limit: Maximum number of results

        Returns:
            List of stock data dictionaries
        """
        if not self._authenticated:
            logger.warning("Not authenticated with Avanza. Returning mock data.")
            return self._get_mock_stock_list(instrument_type, limit)

        try:
            self._rate_limit()
            # Placeholder for actual API call
            # stocks = self._client.get_instruments(instrument_type)
            return []
        except Exception as e:
            logger.error(f"Error fetching stock list: {e}")
            return []

    def get_stock_details(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed information for a specific stock.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Stock details dictionary or None if not found
        """
        if not self._authenticated:
            logger.warning(f"Not authenticated with Avanza. Cannot fetch details for {ticker}")
            return None

        try:
            self._rate_limit()
            # Placeholder for actual API call
            # stock = self._client.get_stock_info(ticker)
            return None
        except Exception as e:
            logger.error(f"Error fetching stock details for {ticker}: {e}")
            return None

    def get_stock_prices(
        self,
        stock_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical price data for a stock.

        Args:
            stock_id: Avanza stock ID
            start_date: Start date for historical data
            end_date: End date for historical data

        Returns:
            List of price data dictionaries
        """
        if not self._authenticated:
            logger.warning(f"Not authenticated with Avanza. Cannot fetch prices for {stock_id}")
            return []

        try:
            self._rate_limit()
            # Placeholder for actual API call
            # prices = self._client.get_chart_data(stock_id, period)
            return []
        except Exception as e:
            logger.error(f"Error fetching stock prices for {stock_id}: {e}")
            return []

    def search_stocks(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Search for stocks by name or ticker.

        Args:
            query: Search query string
            limit: Maximum number of results

        Returns:
            List of matching stocks
        """
        if not self._authenticated:
            logger.warning(f"Not authenticated with Avanza. Mock search for: {query}")
            return []

        try:
            self._rate_limit()
            # Placeholder for actual API call
            # results = self._client.search(query, instrument_type="STOCK")
            return []
        except Exception as e:
            logger.error(f"Error searching stocks with query '{query}': {e}")
            return []

    def _get_mock_stock_list(
        self,
        instrument_type: str = "STOCK",
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Return mock stock data for development/testing.

        This is temporary data for Phase 1 development.
        In production, this should fetch real data from Avanza.
        """
        mock_stocks = [
            {
                "ticker": "VOLV-B",
                "name": "Volvo B",
                "isin": "SE0000115446",
                "sector": "Industrials",
                "industry": "Automobiles",
                "currency": "SEK",
                "exchange": "Stockholm",
                "instrument_type": "STOCK",
            },
            {
                "ticker": "HM-B",
                "name": "H&M B",
                "isin": "SE0000106270",
                "sector": "Consumer Cyclical",
                "industry": "Apparel Retail",
                "currency": "SEK",
                "exchange": "Stockholm",
                "instrument_type": "STOCK",
            },
            {
                "ticker": "ERIC-B",
                "name": "Ericsson B",
                "isin": "SE0000108656",
                "sector": "Technology",
                "industry": "Telecom Equipment",
                "currency": "SEK",
                "exchange": "Stockholm",
                "instrument_type": "STOCK",
            },
            {
                "ticker": "SEB-A",
                "name": "SEB A",
                "isin": "SE0000148884",
                "sector": "Financial Services",
                "industry": "Banks",
                "currency": "SEK",
                "exchange": "Stockholm",
                "instrument_type": "STOCK",
            },
            {
                "ticker": "ATCO-A",
                "name": "Atlas Copco A",
                "isin": "SE0011166610",
                "sector": "Industrials",
                "industry": "Industrial Machinery",
                "currency": "SEK",
                "exchange": "Stockholm",
                "instrument_type": "STOCK",
            },
        ]

        return mock_stocks[:limit]

    def close(self):
        """Close the Avanza client connection."""
        if self._client:
            try:
                # Placeholder for actual cleanup
                # self._client.close()
                pass
            except Exception as e:
                logger.error(f"Error closing Avanza client: {e}")
        self._authenticated = False


# Singleton instance for reuse
_avanza_client_instance: Optional[AvanzaClient] = None


def get_avanza_client() -> AvanzaClient:
    """
    Get or create the Avanza client singleton instance.

    Returns:
        AvanzaClient instance
    """
    global _avanza_client_instance

    if _avanza_client_instance is None:
        # Try to get credentials from settings if available
        username = getattr(settings, 'AVANZA_USERNAME', None)
        password = getattr(settings, 'AVANZA_PASSWORD', None)
        totp_secret = getattr(settings, 'AVANZA_TOTP_SECRET', None)

        _avanza_client_instance = AvanzaClient(
            username=username,
            password=password,
            totp_secret=totp_secret
        )

    return _avanza_client_instance
