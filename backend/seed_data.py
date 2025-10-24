"""Seed database with sample stock data for development."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.infrastructure.database.session import SessionLocal
from app.features.stocks.models import Stock, InstrumentType
from app.features.integrations.avanza.client import AvanzaClient


def seed_stocks():
    """Seed the database with sample stocks from Avanza client."""
    db = SessionLocal()

    try:
        # Create Avanza client (will use mock data)
        avanza = AvanzaClient()

        # Get mock stock list
        mock_stocks = avanza.get_stock_list(limit=5)

        print(f"Fetching {len(mock_stocks)} stocks...")

        for stock_data in mock_stocks:
            # Check if stock already exists
            existing = db.query(Stock).filter(
                Stock.ticker == stock_data["ticker"]
            ).first()

            if existing:
                print(f"  ⏭️  Skipping {stock_data['ticker']} (already exists)")
                continue

            # Create new stock
            stock = Stock(
                ticker=stock_data["ticker"],
                name=stock_data["name"],
                isin=stock_data.get("isin"),
                instrument_type=InstrumentType(stock_data.get("instrument_type", "STOCK")),
                sector=stock_data.get("sector"),
                industry=stock_data.get("industry"),
                currency=stock_data.get("currency", "SEK"),
                exchange=stock_data.get("exchange"),
            )

            db.add(stock)
            print(f"  ✅ Added {stock.ticker} - {stock.name}")

        db.commit()
        print(f"\n✅ Successfully seeded {len(mock_stocks)} stocks!")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding database with sample stocks...\n")
    seed_stocks()
    print("\n✨ Done!")
