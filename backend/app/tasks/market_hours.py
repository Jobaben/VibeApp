"""Market hours utility for US stock markets."""
from datetime import datetime
import pytz


def is_market_hours() -> bool:
    """Check if US markets are currently open.

    US Stock Market Hours:
    - Monday-Friday: 9:30 AM - 4:00 PM Eastern Time
    - Closed on weekends and holidays

    Returns:
        True if market is open, False otherwise
    """
    eastern = pytz.timezone("US/Eastern")
    now = datetime.now(eastern)

    # Check if it's a weekend (Monday=0, Sunday=6)
    if now.weekday() > 4:  # Saturday (5) or Sunday (6)
        return False

    # Market hours: 9:30 AM to 4:00 PM ET
    market_open = now.replace(hour=9, minute=30, second=0, microsecond=0)
    market_close = now.replace(hour=16, minute=0, second=0, microsecond=0)

    return market_open <= now <= market_close


def get_market_status() -> dict:
    """Get detailed market status information.

    Returns:
        Dict with market status details
    """
    eastern = pytz.timezone("US/Eastern")
    now = datetime.now(eastern)

    is_open = is_market_hours()

    if now.weekday() > 4:
        reason = "Weekend"
    elif now.hour < 9 or (now.hour == 9 and now.minute < 30):
        reason = "Pre-market"
    elif now.hour >= 16:
        reason = "After-hours"
    else:
        reason = "Market open" if is_open else "Unknown"

    return {
        "is_open": is_open,
        "current_time_et": now.strftime("%Y-%m-%d %H:%M:%S %Z"),
        "day_of_week": now.strftime("%A"),
        "status": reason,
    }
