"""
Price data service for fetching and managing historical stock prices.

This module handles:
1. Fetching historical OHLCV data from Yahoo Finance or mock data
2. Storing price data in the database
3. Calculating technical indicators (RSI, moving averages, volume trends)
4. Providing data for momentum scoring

Phase 4 implementation for momentum score calculation.
"""
import logging
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, Tuple
from decimal import Decimal
import random

import pandas as pd
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)

# Try to import pandas-ta, but provide fallback if not installed
try:
    import pandas_ta as ta
    HAS_PANDAS_TA = True
except ImportError:
    logger.warning("pandas-ta not installed. Technical indicators will use manual calculations.")
    HAS_PANDAS_TA = False


class PriceDataService:
    """Service for fetching and processing historical price data."""

    def __init__(self):
        """Initialize price data service."""
        self.use_real_api = settings.USE_REAL_STOCK_API and not settings.FORCE_MOCK_DATA

    def fetch_historical_prices_yahoo(
        self,
        ticker: str,
        period: str = "1y",
        interval: str = "1d"
    ) -> Optional[pd.DataFrame]:
        """
        Fetch historical price data from Yahoo Finance using yfinance.

        Args:
            ticker: Stock ticker symbol
            period: Time period (1mo, 3mo, 6mo, 1y, 2y, 5y)
            interval: Data interval (1d, 1wk, 1mo)

        Returns:
            DataFrame with OHLCV data or None if error
        """
        try:
            import yfinance as yf

            # Download data
            stock = yf.Ticker(ticker)
            df = stock.history(period=period, interval=interval)

            if df.empty:
                logger.warning(f"No price data returned for {ticker}")
                return None

            # Standardize column names
            df.columns = df.columns.str.lower()
            df.index.name = 'date'
            df = df.reset_index()

            # Ensure we have required columns
            required_cols = ['date', 'open', 'high', 'low', 'close', 'volume']
            if not all(col in df.columns for col in required_cols):
                logger.error(f"Missing required columns for {ticker}")
                return None

            logger.info(f"✅ Fetched {len(df)} price records for {ticker}")
            return df

        except Exception as e:
            logger.error(f"Error fetching Yahoo Finance data for {ticker}: {e}")
            return None

    def generate_mock_historical_prices(
        self,
        ticker: str,
        days: int = 365,
        start_price: float = 100.0,
        volatility: float = 0.02,
        trend: float = 0.0001
    ) -> pd.DataFrame:
        """
        Generate realistic mock historical price data using geometric Brownian motion.

        Args:
            ticker: Stock ticker symbol
            days: Number of days of historical data
            start_price: Starting price
            volatility: Daily volatility (0.02 = 2%)
            trend: Daily drift (0.0001 = 0.01% per day)

        Returns:
            DataFrame with OHLCV data
        """
        logger.info(f"Generating {days} days of mock price data for {ticker}")

        # Generate dates
        end_date = datetime.now()
        dates = pd.date_range(end=end_date, periods=days, freq='D')

        # Generate prices using geometric Brownian motion
        prices = [start_price]
        for _ in range(days - 1):
            # Random walk with drift
            change = np.random.normal(trend, volatility)
            new_price = prices[-1] * (1 + change)
            prices.append(max(new_price, 0.01))  # Prevent negative prices

        prices = np.array(prices)

        # Generate OHLC from close prices
        data = []
        for i, (date, close) in enumerate(zip(dates, prices)):
            # Generate realistic OHLC
            daily_range = close * np.random.uniform(0.01, 0.05)  # 1-5% daily range
            high = close + np.random.uniform(0, daily_range)
            low = close - np.random.uniform(0, daily_range)
            open_price = low + np.random.uniform(0, high - low)

            # Generate volume (higher volume = higher volatility)
            base_volume = 1000000
            volume = int(base_volume * np.random.lognormal(0, 0.5))

            data.append({
                'date': date,
                'open': round(open_price, 2),
                'high': round(high, 2),
                'low': round(low, 2),
                'close': round(close, 2),
                'volume': volume,
            })

        df = pd.DataFrame(data)
        logger.info(f"✅ Generated {len(df)} price records for {ticker}")
        return df

    def fetch_historical_prices(
        self,
        ticker: str,
        period: str = "1y",
        use_mock: Optional[bool] = None
    ) -> Optional[pd.DataFrame]:
        """
        Fetch historical prices, using real API or mock data based on configuration.

        Args:
            ticker: Stock ticker symbol
            period: Time period for data
            use_mock: Override to force mock data (None = use settings)

        Returns:
            DataFrame with OHLCV data
        """
        # Determine whether to use mock data
        should_use_mock = use_mock if use_mock is not None else not self.use_real_api

        if should_use_mock:
            # Generate mock data
            days_map = {
                "1mo": 30,
                "3mo": 90,
                "6mo": 180,
                "1y": 365,
                "2y": 730,
                "5y": 1825,
            }
            days = days_map.get(period, 365)

            # Use ticker-based seed for consistent mock data
            np.random.seed(hash(ticker) % 2**32)
            df = self.generate_mock_historical_prices(ticker, days=days)
            np.random.seed()  # Reset seed
            return df
        else:
            # Try real API, fallback to mock
            df = self.fetch_historical_prices_yahoo(ticker, period=period)
            if df is None:
                logger.warning(f"Falling back to mock data for {ticker}")
                return self.fetch_historical_prices(ticker, period=period, use_mock=True)
            return df

    def calculate_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate technical indicators for price data.

        Indicators calculated:
        - SMA 50-day and 200-day (Simple Moving Averages)
        - RSI 14-day (Relative Strength Index)
        - Volume SMA 20-day
        - Price vs MA ratios

        Args:
            df: DataFrame with OHLCV data (must have 'close', 'volume' columns)

        Returns:
            DataFrame with added technical indicator columns
        """
        if df is None or df.empty:
            return df

        df = df.copy()

        try:
            if HAS_PANDAS_TA:
                # Use pandas-ta library
                df.ta.sma(close='close', length=50, append=True)
                df.ta.sma(close='close', length=200, append=True)
                df.ta.rsi(close='close', length=14, append=True)

                # Rename columns to our standard names
                df.rename(columns={
                    'SMA_50': 'sma_50',
                    'SMA_200': 'sma_200',
                    'RSI_14': 'rsi'
                }, inplace=True)
            else:
                # Manual calculations
                df['sma_50'] = df['close'].rolling(window=50, min_periods=1).mean()
                df['sma_200'] = df['close'].rolling(window=200, min_periods=1).mean()
                df['rsi'] = self._calculate_rsi(df['close'], period=14)

            # Volume moving average
            df['volume_sma_20'] = df['volume'].rolling(window=20, min_periods=1).mean()

            # Price vs MA ratios (for scoring)
            df['price_vs_sma50'] = (df['close'] / df['sma_50'] - 1) * 100
            df['price_vs_sma200'] = (df['close'] / df['sma_200'] - 1) * 100

            # Volume trend (current vs average)
            df['volume_trend'] = (df['volume'] / df['volume_sma_20'] - 1) * 100

            logger.info(f"✅ Calculated technical indicators for {len(df)} records")
            return df

        except Exception as e:
            logger.error(f"Error calculating technical indicators: {e}")
            return df

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """
        Calculate RSI (Relative Strength Index) manually.

        Args:
            prices: Series of close prices
            period: RSI period (default 14)

        Returns:
            Series of RSI values (0-100)
        """
        # Calculate price changes
        delta = prices.diff()

        # Separate gains and losses
        gains = delta.where(delta > 0, 0)
        losses = -delta.where(delta < 0, 0)

        # Calculate average gains and losses
        avg_gains = gains.rolling(window=period, min_periods=1).mean()
        avg_losses = losses.rolling(window=period, min_periods=1).mean()

        # Calculate RS and RSI
        rs = avg_gains / avg_losses.replace(0, 1e-10)  # Avoid division by zero
        rsi = 100 - (100 / (1 + rs))

        return rsi

    def get_latest_indicators(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Extract latest technical indicator values from DataFrame.

        Args:
            df: DataFrame with calculated indicators

        Returns:
            Dictionary with latest indicator values
        """
        if df is None or df.empty:
            return self._get_neutral_indicators()

        try:
            latest = df.iloc[-1]

            return {
                'price': float(latest.get('close', 0)),
                'sma_50': float(latest.get('sma_50', latest.get('close', 0))),
                'sma_200': float(latest.get('sma_200', latest.get('close', 0))),
                'rsi': float(latest.get('rsi', 50)),
                'volume': int(latest.get('volume', 0)),
                'volume_sma_20': int(latest.get('volume_sma_20', latest.get('volume', 0))),
                'price_vs_sma50': float(latest.get('price_vs_sma50', 0)),
                'price_vs_sma200': float(latest.get('price_vs_sma200', 0)),
                'volume_trend': float(latest.get('volume_trend', 0)),
            }
        except Exception as e:
            logger.error(f"Error extracting indicators: {e}")
            return self._get_neutral_indicators()

    def _get_neutral_indicators(self) -> Dict[str, float]:
        """Return neutral indicator values when data is unavailable."""
        return {
            'price': 0,
            'sma_50': 0,
            'sma_200': 0,
            'rsi': 50,  # Neutral RSI
            'volume': 0,
            'volume_sma_20': 0,
            'price_vs_sma50': 0,
            'price_vs_sma200': 0,
            'volume_trend': 0,
        }

    def prepare_price_records(
        self,
        ticker: str,
        df: pd.DataFrame,
        stock_id: str
    ) -> List[Dict[str, Any]]:
        """
        Convert DataFrame to list of database records.

        Args:
            ticker: Stock ticker
            df: DataFrame with OHLCV data
            stock_id: UUID of the stock

        Returns:
            List of dictionaries ready for database insertion
        """
        records = []

        for _, row in df.iterrows():
            record = {
                'stock_id': stock_id,
                'date': row['date'].date() if isinstance(row['date'], pd.Timestamp) else row['date'],
                'open': Decimal(str(row['open'])) if pd.notna(row['open']) else None,
                'high': Decimal(str(row['high'])) if pd.notna(row['high']) else None,
                'low': Decimal(str(row['low'])) if pd.notna(row['low']) else None,
                'close': Decimal(str(row['close'])),
                'volume': int(row['volume']) if pd.notna(row['volume']) else None,
                'adjusted_close': Decimal(str(row.get('adjusted_close', row['close']))),
            }
            records.append(record)

        logger.info(f"Prepared {len(records)} price records for {ticker}")
        return records


# Singleton instance
_price_data_service_instance: Optional[PriceDataService] = None


def get_price_data_service() -> PriceDataService:
    """
    Get or create the price data service singleton.

    Returns:
        PriceDataService instance
    """
    global _price_data_service_instance

    if _price_data_service_instance is None:
        _price_data_service_instance = PriceDataService()

    return _price_data_service_instance
