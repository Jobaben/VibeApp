"""Yahoo Finance API client for fetching real stock data."""
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime
import requests
import time

from app.config import settings
from app.features.integrations.mock_stock_data import get_mock_stock_data

logger = logging.getLogger(__name__)


class YahooFinanceClient:
    """
    Client for fetching stock data from Yahoo Finance API.

    This client uses Yahoo Finance's free API endpoints to fetch:
    - Stock quotes and basic info
    - Historical price data
    - Company fundamentals
    - No authentication required
    """

    BASE_URL = "https://query2.finance.yahoo.com/v10/finance"
    QUOTE_URL = "https://query2.finance.yahoo.com/v7/finance/quote"
    CHART_URL = "https://query2.finance.yahoo.com/v8/finance/chart"

    def __init__(self):
        """Initialize Yahoo Finance client."""
        self._session = requests.Session()
        self._session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })
        self._last_request_time = 0
        self._min_request_interval = 0.5  # 500ms between requests to avoid rate limiting

    def _rate_limit(self):
        """Implement rate limiting."""
        current_time = time.time()
        time_since_last = current_time - self._last_request_time
        if time_since_last < self._min_request_interval:
            time.sleep(self._min_request_interval - time_since_last)
        self._last_request_time = time.time()

    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get current quote for a stock symbol.

        Args:
            symbol: Stock ticker symbol (e.g., 'AAPL', 'MSFT')

        Returns:
            Dictionary with quote data or None if error
        """
        try:
            self._rate_limit()
            response = self._session.get(
                self.QUOTE_URL,
                params={'symbols': symbol},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if 'quoteResponse' in data and 'result' in data['quoteResponse']:
                results = data['quoteResponse']['result']
                if results:
                    return results[0]
            return None

        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {e}")
            return None

    def get_multiple_quotes(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """
        Get quotes for multiple symbols at once.

        Behavior based on configuration:
        - If FORCE_MOCK_DATA=true: Always use mock data
        - If USE_REAL_STOCK_API=false: Use mock data (default for AI/automated use)
        - If USE_REAL_STOCK_API=true: Try Yahoo Finance, fallback to mock on errors

        Args:
            symbols: List of stock ticker symbols

        Returns:
            List of quote dictionaries
        """
        # Check if we should use mock data immediately
        if settings.FORCE_MOCK_DATA:
            logger.info("FORCE_MOCK_DATA is enabled - using mock stock data")
            return self._get_mock_quotes(symbols)

        if not settings.USE_REAL_STOCK_API:
            logger.info("USE_REAL_STOCK_API is disabled - using mock stock data (safe for automated use)")
            return self._get_mock_quotes(symbols)

        # Try to fetch from Yahoo Finance
        logger.info("USE_REAL_STOCK_API is enabled - attempting to fetch from Yahoo Finance...")
        try:
            self._rate_limit()
            # Yahoo Finance allows comma-separated symbols
            symbols_str = ','.join(symbols)
            response = self._session.get(
                self.QUOTE_URL,
                params={'symbols': symbols_str},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if 'quoteResponse' in data and 'result' in data['quoteResponse']:
                results = data['quoteResponse']['result']
                if results:
                    logger.info(f"✅ Successfully fetched {len(results)} quotes from Yahoo Finance!")
                    return results

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                logger.warning(f"⚠️  Yahoo Finance blocked request (403). Falling back to mock data.")
                logger.info("Tip: Yahoo Finance may block automated requests. Mock data works reliably.")
            else:
                logger.error(f"HTTP error fetching quotes: {e}")
        except Exception as e:
            logger.error(f"Error fetching quotes from Yahoo Finance: {e}")

        # Fallback to mock data
        logger.info("Using enhanced mock stock data as fallback")
        return self._get_mock_quotes(symbols)

    def _get_mock_quotes(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """
        Get mock stock quotes.

        Args:
            symbols: List of stock ticker symbols to filter

        Returns:
            List of mock stock data
        """
        mock_data = get_mock_stock_data()
        # Filter to requested symbols if specific symbols were requested
        if symbols:
            mock_data = [stock for stock in mock_data if stock['symbol'] in symbols]
        return mock_data[:len(symbols)] if symbols else mock_data

    def get_chart_data(
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d"
    ) -> Optional[Dict[str, Any]]:
        """
        Get historical chart data for a symbol.

        Args:
            symbol: Stock ticker symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)

        Returns:
            Dictionary with chart data or None if error
        """
        try:
            self._rate_limit()
            url = f"{self.CHART_URL}/{symbol}"
            response = self._session.get(
                url,
                params={'range': period, 'interval': interval},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if 'chart' in data and 'result' in data['chart']:
                results = data['chart']['result']
                if results:
                    return results[0]
            return None

        except Exception as e:
            logger.error(f"Error fetching chart data for {symbol}: {e}")
            return None

    def search_symbols(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for stock symbols.

        Args:
            query: Search query string

        Returns:
            List of matching stocks
        """
        try:
            self._rate_limit()
            url = "https://query2.finance.yahoo.com/v1/finance/search"
            response = self._session.get(
                url,
                params={'q': query, 'quotesCount': 10, 'newsCount': 0},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if 'quotes' in data:
                return data['quotes']
            return []

        except Exception as e:
            logger.error(f"Error searching for '{query}': {e}")
            return []

    def get_popular_stocks(self) -> List[str]:
        """
        Get list of popular stock symbols that work reliably with Yahoo Finance.

        Returns:
            List of ticker symbols (US stocks for reliable data)
        """
        # Popular US stocks - these work reliably with Yahoo Finance
        # We'll use these for MVP, can add Swedish stocks later
        return [
            "AAPL",   # Apple
            "MSFT",   # Microsoft
            "GOOGL",  # Alphabet/Google
            "AMZN",   # Amazon
            "TSLA",   # Tesla
            "META",   # Meta/Facebook
            "NVDA",   # NVIDIA
            "JPM",    # JPMorgan Chase
            "V",      # Visa
            "WMT",    # Walmart
            "DIS",    # Disney
            "NFLX",   # Netflix
            "INTC",   # Intel
            "CSCO",   # Cisco
            "PFE",    # Pfizer
        ]

    def get_popular_swedish_stocks(self) -> List[str]:
        """
        Get list of popular Swedish stock symbols (fallback/mock).

        Returns:
            List of ticker symbols with .ST suffix
        """
        # Swedish stocks - may not work reliably due to Yahoo Finance restrictions
        return [
            "VOLV-B.ST",   # Volvo B
            "HM-B.ST",     # H&M B
            "ERIC-B.ST",   # Ericsson B
            "SEB-A.ST",    # SEB A
            "ATCO-A.ST",   # Atlas Copco A
        ]

    def format_stock_for_db(self, quote_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format Yahoo Finance quote data for our database schema.

        Args:
            quote_data: Raw quote data from Yahoo Finance

        Returns:
            Formatted data matching our Stock model
        """
        symbol = quote_data.get('symbol', '')
        # Remove exchange suffixes (.ST for Stockholm, etc.) and replace dots with dashes
        ticker = symbol.replace('.ST', '').replace('.', '-')

        # Determine currency based on exchange
        currency = quote_data.get('currency', 'USD')
        if '.ST' in symbol:
            currency = 'SEK'

        return {
            'ticker': ticker,
            'name': quote_data.get('longName') or quote_data.get('shortName', ticker),
            'isin': quote_data.get('isin'),
            'sector': quote_data.get('sector'),
            'industry': quote_data.get('industry'),
            'market_cap': quote_data.get('marketCap'),
            'currency': currency,
            'exchange': quote_data.get('fullExchangeName', quote_data.get('exchange', 'Unknown')),
            'instrument_type': self._get_instrument_type(quote_data.get('quoteType', 'EQUITY')),
        }

    def _get_instrument_type(self, quote_type: str) -> str:
        """Map Yahoo Finance quote type to our instrument type."""
        mapping = {
            'EQUITY': 'STOCK',
            'ETF': 'ETF',
            'MUTUALFUND': 'FUND',
            'INDEX': 'OTHER',
            'CURRENCY': 'OTHER',
            'FUTURES': 'OTHER',
        }
        return mapping.get(quote_type.upper(), 'STOCK')

    def close(self):
        """Close the session."""
        self._session.close()


# Singleton instance
_yahoo_client_instance: Optional[YahooFinanceClient] = None


def get_yahoo_finance_client() -> YahooFinanceClient:
    """
    Get or create the Yahoo Finance client singleton.

    Returns:
        YahooFinanceClient instance
    """
    global _yahoo_client_instance

    if _yahoo_client_instance is None:
        _yahoo_client_instance = YahooFinanceClient()

    return _yahoo_client_instance
