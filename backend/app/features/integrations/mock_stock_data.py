"""
Enhanced mock stock data provider.

Yahoo Finance blocks automated requests, so this provides realistic mock data
for development. For production, use a paid API service like:
- Alpha Vantage (https://www.alphavantage.co/) - Free tier available
- Financial Modeling Prep (https://financialmodelingprep.com/) - Affordable API
- IEX Cloud (https://iexcloud.io/) - Reliable data
- Twelve Data (https://twelvedata.com/) - Good free tier
"""
from typing import List, Dict, Any
from datetime import datetime


def get_mock_stock_data() -> List[Dict[str, Any]]:
    """
    Get realistic mock stock data for development.

    Returns:
        List of stock dictionaries with complete information
    """
    return [
        {
            "symbol": "AAPL",
            "ticker": "AAPL",
            "name": "Apple Inc.",
            "longName": "Apple Inc.",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "marketCap": 2800000000000,  # $2.8T
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "MSFT",
            "ticker": "MSFT",
            "name": "Microsoft Corporation",
            "longName": "Microsoft Corporation",
            "sector": "Technology",
            "industry": "Software - Infrastructure",
            "marketCap": 2600000000000,  # $2.6T
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "GOOGL",
            "ticker": "GOOGL",
            "name": "Alphabet Inc.",
            "longName": "Alphabet Inc.",
            "sector": "Communication Services",
            "industry": "Internet Content & Information",
            "marketCap": 1700000000000,  # $1.7T
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "AMZN",
            "ticker": "AMZN",
            "name": "Amazon.com Inc.",
            "longName": "Amazon.com, Inc.",
            "sector": "Consumer Cyclical",
            "industry": "Internet Retail",
            "marketCap": 1500000000000,  # $1.5T
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "TSLA",
            "ticker": "TSLA",
            "name": "Tesla Inc.",
            "longName": "Tesla, Inc.",
            "sector": "Consumer Cyclical",
            "industry": "Auto Manufacturers",
            "marketCap": 800000000000,  # $800B
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "META",
            "ticker": "META",
            "name": "Meta Platforms Inc.",
            "longName": "Meta Platforms, Inc.",
            "sector": "Communication Services",
            "industry": "Internet Content & Information",
            "marketCap": 900000000000,  # $900B
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "NVDA",
            "ticker": "NVDA",
            "name": "NVIDIA Corporation",
            "longName": "NVIDIA Corporation",
            "sector": "Technology",
            "industry": "Semiconductors",
            "marketCap": 1200000000000,  # $1.2T
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "JPM",
            "ticker": "JPM",
            "name": "JPMorgan Chase & Co.",
            "longName": "JPMorgan Chase & Co.",
            "sector": "Financial Services",
            "industry": "Banks - Diversified",
            "marketCap": 500000000000,  # $500B
            "currency": "USD",
            "exchange": "NYSE",
            "fullExchangeName": "New York Stock Exchange",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "V",
            "ticker": "V",
            "name": "Visa Inc.",
            "longName": "Visa Inc.",
            "sector": "Financial Services",
            "industry": "Credit Services",
            "marketCap": 520000000000,  # $520B
            "currency": "USD",
            "exchange": "NYSE",
            "fullExchangeName": "New York Stock Exchange",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "WMT",
            "ticker": "WMT",
            "name": "Walmart Inc.",
            "longName": "Walmart Inc.",
            "sector": "Consumer Defensive",
            "industry": "Discount Stores",
            "marketCap": 420000000000,  # $420B
            "currency": "USD",
            "exchange": "NYSE",
            "fullExchangeName": "New York Stock Exchange",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "DIS",
            "ticker": "DIS",
            "name": "The Walt Disney Company",
            "longName": "The Walt Disney Company",
            "sector": "Communication Services",
            "industry": "Entertainment",
            "marketCap": 200000000000,  # $200B
            "currency": "USD",
            "exchange": "NYSE",
            "fullExchangeName": "New York Stock Exchange",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "NFLX",
            "ticker": "NFLX",
            "name": "Netflix Inc.",
            "longName": "Netflix, Inc.",
            "sector": "Communication Services",
            "industry": "Entertainment",
            "marketCap": 250000000000,  # $250B
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "INTC",
            "ticker": "INTC",
            "name": "Intel Corporation",
            "longName": "Intel Corporation",
            "sector": "Technology",
            "industry": "Semiconductors",
            "marketCap": 180000000000,  # $180B
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "CSCO",
            "ticker": "CSCO",
            "name": "Cisco Systems Inc.",
            "longName": "Cisco Systems, Inc.",
            "sector": "Technology",
            "industry": "Communication Equipment",
            "marketCap": 210000000000,  # $210B
            "currency": "USD",
            "exchange": "NASDAQ",
            "fullExchangeName": "NasdaqGS",
            "quoteType": "EQUITY",
        },
        {
            "symbol": "PFE",
            "ticker": "PFE",
            "name": "Pfizer Inc.",
            "longName": "Pfizer Inc.",
            "sector": "Healthcare",
            "industry": "Drug Manufacturers - General",
            "marketCap": 160000000000,  # $160B
            "currency": "USD",
            "exchange": "NYSE",
            "fullExchangeName": "New York Stock Exchange",
            "quoteType": "EQUITY",
        },
    ]
