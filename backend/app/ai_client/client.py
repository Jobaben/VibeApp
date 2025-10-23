"""
Python client for AI to interact with Avanza Stock Finder backend.

This client provides a simple, pandas-friendly interface for querying stock data
and performing analysis programmatically.

Example usage:
    >>> from app.ai_client import AvanzaAIClient
    >>> client = AvanzaAIClient()
    >>>
    >>> # Find value stocks
    >>> stocks = client.analyze_stocks({"min_roic": 15, "max_pe": 20})
    >>> print(stocks.head())
    >>>
    >>> # Deep dive on a stock
    >>> volvo = client.deep_dive("VOLV-B")
    >>> print(f"Score: {volvo['scores']['total']}")
    >>>
    >>> # Compare stocks
    >>> comparison = client.compare(["VOLV-B", "SCVB"])
    >>> print(comparison[["ticker", "roic", "roe", "total_score"]])
"""

import requests
import pandas as pd
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)


class AvanzaAIClient:
    """
    Python client for AI to interact with the Avanza Stock Finder backend.

    Provides simple methods for:
    - Analyzing stocks by criteria
    - Getting pre-built strategy results
    - Deep diving on individual stocks
    - Comparing multiple stocks
    - Running custom screeners
    """

    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Initialize the AI client.

        Args:
            base_url: Base URL of the backend API (default: http://localhost:8000)
        """
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "AvanzaAIClient/1.0"
        })

    def health_check(self) -> Dict[str, Any]:
        """
        Check if the API is accessible and healthy.

        Returns:
            Health status information
        """
        try:
            response = self.session.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}

    def analyze_stocks(
        self,
        criteria: Optional[Dict[str, Any]] = None,
        limit: int = 50
    ) -> pd.DataFrame:
        """
        Analyze stocks based on criteria.

        Args:
            criteria: Dictionary of screening criteria, e.g.:
                {
                    "min_roic": 15,
                    "max_pe": 20,
                    "min_roe": 10,
                    "max_debt_equity": 0.5,
                    "sectors": ["Industrials", "Technology"]
                }
            limit: Maximum number of results (default: 50)

        Returns:
            DataFrame with stock analysis results

        Example:
            >>> stocks = client.analyze_stocks({"min_roic": 15, "max_pe": 20})
            >>> print(stocks[["ticker", "name", "total_score", "signal"]])
        """
        criteria = criteria or {}

        try:
            response = self.session.post(
                f"{self.base_url}/api/ai/analyze-stocks",
                json={"criteria": criteria, "limit": limit},
                params={"limit": limit}
            )
            response.raise_for_status()
            data = response.json()

            # Convert stocks list to DataFrame
            if data.get("stocks"):
                stocks = data["stocks"]
                # Flatten nested structures for easier analysis
                flattened = []
                for stock in stocks:
                    flat = {
                        "ticker": stock["ticker"],
                        "name": stock["name"],
                        "price": stock["price"],
                        "sector": stock.get("sector"),
                        "industry": stock.get("industry"),
                        "signal": stock["signal"],
                        "total_score": stock["scores"]["total"],
                        "value_score": stock["scores"]["value"],
                        "quality_score": stock["scores"]["quality"],
                        "momentum_score": stock["scores"]["momentum"],
                        "health_score": stock["scores"]["health"],
                    }
                    # Add fundamentals
                    for key, value in stock["fundamentals"].items():
                        flat[key] = value

                    # Add sector comparisons if available
                    if stock.get("vs_sector"):
                        for key, value in stock["vs_sector"].items():
                            flat[f"sector_{key}"] = value

                    flattened.append(flat)

                return pd.DataFrame(flattened)
            else:
                return pd.DataFrame()

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to analyze stocks: {e}")
            return pd.DataFrame()

    def get_top_stocks(self, strategy: str = "value_gems", limit: int = 20) -> pd.DataFrame:
        """
        Get pre-built strategy results.

        Available strategies:
        - value_gems: Low P/E + High ROIC + Low Debt
        - quality_compounders: High ROIC + High margins
        - dividend_kings: High dividend yield + stable history
        - deep_value: P/B < 1.0 + Positive FCF
        - explosive_growth: Revenue growth >30% + Low PEG

        Args:
            strategy: Strategy name
            limit: Maximum number of results (default: 20)

        Returns:
            DataFrame with strategy results

        Example:
            >>> gems = client.get_top_stocks("value_gems")
            >>> print(gems.head())
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/ai/strategies/{strategy}",
                params={"limit": limit}
            )
            response.raise_for_status()
            data = response.json()

            if data.get("results"):
                return pd.DataFrame(data["results"])
            else:
                return pd.DataFrame()

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get strategy results: {e}")
            return pd.DataFrame()

    def deep_dive(self, ticker: str) -> Dict[str, Any]:
        """
        Get complete analysis of a single stock.

        Args:
            ticker: Stock ticker (e.g., "VOLV-B")

        Returns:
            Dictionary with complete stock analysis including:
            - Scores and signal
            - All fundamentals
            - Technical indicators
            - AI insights (strengths, weaknesses, catalysts)
            - Historical trends
            - Peer comparison

        Example:
            >>> volvo = client.deep_dive("VOLV-B")
            >>> print(f"Score: {volvo['stock']['scores']['total']}")
            >>> print(f"Strengths: {volvo['stock']['ai_insights']['strengths']}")
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/ai/stock/{ticker}/deep-analysis"
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to deep dive on {ticker}: {e}")
            return {}

    def compare(self, tickers: List[str]) -> pd.DataFrame:
        """
        Compare multiple stocks side-by-side.

        Args:
            tickers: List of stock tickers to compare

        Returns:
            DataFrame with side-by-side comparison

        Example:
            >>> comparison = client.compare(["VOLV-B", "SCVB", "GETI-B"])
            >>> print(comparison[["ticker", "roic", "roe", "pe_ratio", "total_score"]])
        """
        try:
            response = self.session.post(
                f"{self.base_url}/api/ai/compare-stocks",
                json={"tickers": tickers}
            )
            response.raise_for_status()
            data = response.json()

            if data.get("stocks"):
                stocks = data["stocks"]
                # Flatten for DataFrame
                flattened = []
                for stock in stocks:
                    flat = {
                        "ticker": stock["ticker"],
                        "name": stock["name"],
                        "price": stock["price"],
                        "sector": stock.get("sector"),
                        "signal": stock["signal"],
                        "total_score": stock["scores"]["total"],
                        "value_score": stock["scores"]["value"],
                        "quality_score": stock["scores"]["quality"],
                        "momentum_score": stock["scores"]["momentum"],
                        "health_score": stock["scores"]["health"],
                    }
                    # Add fundamentals
                    for key, value in stock["fundamentals"].items():
                        flat[key] = value

                    flattened.append(flat)

                return pd.DataFrame(flattened)
            else:
                return pd.DataFrame()

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to compare stocks: {e}")
            return pd.DataFrame()

    def run_custom_screener(self, expression: str) -> pd.DataFrame:
        """
        Run a custom screening query with dynamic expressions.

        Args:
            expression: Boolean expression string, e.g.:
                "ROIC > 15 AND PE < 20 AND Debt_Equity < 0.5"

        Returns:
            DataFrame with screening results

        Example:
            >>> results = client.run_custom_screener("ROIC > 20 AND PE < 15")
            >>> print(results.head())
        """
        try:
            response = self.session.post(
                f"{self.base_url}/api/ai/run-custom-screener",
                params={"expression": expression}
            )
            response.raise_for_status()
            data = response.json()

            if data.get("results"):
                return pd.DataFrame(data["results"])
            else:
                return pd.DataFrame()

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to run custom screener: {e}")
            return pd.DataFrame()

    def get_sector_leaders(self, sector: str, top_n: int = 10) -> pd.DataFrame:
        """
        Get top stocks in a specific sector.

        Args:
            sector: Sector name (e.g., "Industrials", "Technology")
            top_n: Number of top stocks to return

        Returns:
            DataFrame with top stocks in the sector

        Example:
            >>> tech_leaders = client.get_sector_leaders("Technology", top_n=5)
            >>> print(tech_leaders)
        """
        criteria = {"sectors": [sector]}
        df = self.analyze_stocks(criteria, limit=100)

        if not df.empty:
            # Sort by total score and return top N
            return df.nlargest(top_n, "total_score")
        else:
            return pd.DataFrame()


# Convenience function for quick access
def get_client(base_url: str = "http://localhost:8000") -> AvanzaAIClient:
    """
    Get an instance of the AvanzaAIClient.

    Args:
        base_url: Base URL of the backend API

    Returns:
        Configured AvanzaAIClient instance

    Example:
        >>> from app.ai_client import get_client
        >>> client = get_client()
        >>> stocks = client.get_top_stocks("value_gems")
    """
    return AvanzaAIClient(base_url)
