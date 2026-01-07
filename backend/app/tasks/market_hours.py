"""Market hours utility functions."""
from datetime import datetime
import pytz


def is_market_hours() -> bool:
    """Check if US markets are currently open.

    US markets are open:
    - Monday through Friday (weekdays)
    - 9:30 AM to 4:00 PM Eastern Time

    Note: This does not account for market holidays.

    Returns:
        True if markets are open, False otherwise
    """
    eastern = pytz.timezone("US/Eastern")
    now = datetime.now(eastern)

    # Check if weekend (Saturday=5, Sunday=6)
    if now.weekday() > 4:
        return False

    # Create market open and close times for today
    market_open = now.replace(hour=9, minute=30, second=0, microsecond=0)
    market_close = now.replace(hour=16, minute=0, second=0, microsecond=0)

    return market_open <= now <= market_close


def get_next_market_open() -> datetime:
    """Get the next market open time.

    Returns:
        datetime of next market open in Eastern Time
    """
    eastern = pytz.timezone("US/Eastern")
    now = datetime.now(eastern)

    # Start with today's market open
    next_open = now.replace(hour=9, minute=30, second=0, microsecond=0)

    # If we're past today's open, move to next day
    if now >= next_open:
        from datetime import timedelta
        next_open += timedelta(days=1)

    # Skip weekends
    while next_open.weekday() > 4:
        from datetime import timedelta
        next_open += timedelta(days=1)

    return next_open


def get_market_status() -> dict:
    """Get current market status information.

    Returns:
        Dictionary with market status details
    """
    eastern = pytz.timezone("US/Eastern")
    now = datetime.now(eastern)
    is_open = is_market_hours()

    return {
        "is_open": is_open,
        "current_time_et": now.strftime("%Y-%m-%d %H:%M:%S %Z"),
        "weekday": now.strftime("%A"),
        "status": "Open" if is_open else "Closed",
    }
