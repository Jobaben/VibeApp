"""Seed database with sample stock data for development."""
import sys
from pathlib import Path
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.infrastructure.database import Base, engine
from app.infrastructure.database.session import SessionLocal
from app.features.stocks.models import (
    Stock,
    StockFundamental,
    StockScore,
    InstrumentType,
    Signal
)
from app.features.integrations.mock_stock_data import get_mock_stock_data
from app.features.stocks.services.sector_service import SectorService


def seed_stocks():
    """Seed the database with sample stocks and fundamentals."""
    # Ensure tables exist before seeding
    print("📦 Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Get enhanced mock stock data with fundamentals
        mock_stocks = get_mock_stock_data()

        print(f"Seeding {len(mock_stocks)} stocks with fundamentals...\n")

        stocks_added = 0

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
                instrument_type=InstrumentType.STOCK,
                sector=stock_data.get("sector"),
                industry=stock_data.get("industry"),
                market_cap=stock_data.get("marketCap"),
                currency=stock_data.get("currency", "USD"),
                exchange=stock_data.get("exchange"),
            )

            db.add(stock)
            db.flush()  # Get the stock ID

            # Create fundamentals if available
            if any(key in stock_data for key in ["pe_ratio", "roic", "roe"]):
                fundamentals = StockFundamental(
                    stock_id=stock.id,
                    pe_ratio=Decimal(str(stock_data["pe_ratio"])) if stock_data.get("pe_ratio") else None,
                    ev_ebitda=Decimal(str(stock_data["ev_ebitda"])) if stock_data.get("ev_ebitda") else None,
                    peg_ratio=Decimal(str(stock_data["peg_ratio"])) if stock_data.get("peg_ratio") else None,
                    pb_ratio=Decimal(str(stock_data["pb_ratio"])) if stock_data.get("pb_ratio") else None,
                    ps_ratio=Decimal(str(stock_data["ps_ratio"])) if stock_data.get("ps_ratio") else None,
                    roic=Decimal(str(stock_data["roic"])) if stock_data.get("roic") else None,
                    roe=Decimal(str(stock_data["roe"])) if stock_data.get("roe") else None,
                    gross_margin=Decimal(str(stock_data["gross_margin"])) if stock_data.get("gross_margin") else None,
                    operating_margin=Decimal(str(stock_data["operating_margin"])) if stock_data.get("operating_margin") else None,
                    net_margin=Decimal(str(stock_data["net_margin"])) if stock_data.get("net_margin") else None,
                    debt_equity=Decimal(str(stock_data["debt_equity"])) if stock_data.get("debt_equity") else None,
                    current_ratio=Decimal(str(stock_data["current_ratio"])) if stock_data.get("current_ratio") else None,
                    fcf_yield=Decimal(str(stock_data["fcf_yield"])) if stock_data.get("fcf_yield") else None,
                    interest_coverage=Decimal(str(stock_data["interest_coverage"])) if stock_data.get("interest_coverage") else None,
                    revenue_growth=Decimal(str(stock_data["revenue_growth"])) if stock_data.get("revenue_growth") else None,
                    earnings_growth=Decimal(str(stock_data["earnings_growth"])) if stock_data.get("earnings_growth") else None,
                    dividend_yield=Decimal(str(stock_data["dividend_yield"])) if stock_data.get("dividend_yield") else None,
                    payout_ratio=Decimal(str(stock_data["payout_ratio"])) if stock_data.get("payout_ratio") else None,
                )
                db.add(fundamentals)
                print(f"  ✅ Added {stock.ticker} - {stock.name}")
                stocks_added += 1
            else:
                print(f"  ✅ Added {stock.ticker} - {stock.name} (no fundamentals)")
                stocks_added += 1

        db.commit()
        print(f"\n✅ Successfully seeded {stocks_added} stocks with fundamentals!")

        # Now calculate scores using the real scoring engine
        if stocks_added > 0:
            print("\n🧮 Calculating scores using the scoring engine...")
            sector_service = SectorService(db)

            # Calculate sector averages
            print("  📊 Calculating sector averages...")
            sector_benchmarks = sector_service.calculate_and_cache_sector_averages()
            print(f"  ✅ Calculated averages for {len(sector_benchmarks)} sectors")

            # Calculate scores for all stocks
            print("  🎯 Calculating stock scores...")
            scored_count = sector_service.calculate_scores_for_all_stocks()
            print(f"  ✅ Scored {scored_count} stocks")

            # Show sample scores
            print("\n  📋 Sample scores:")
            sample_stocks = db.query(Stock, StockScore).join(StockScore).order_by(StockScore.total_score.desc()).limit(5).all()
            for stock, score in sample_stocks:
                print(f"    {stock.ticker:6} - Score: {float(score.total_score):5.1f}/100 | Signal: {score.signal.value:12} | {stock.name[:40]}")

        print(f"\n✅ Successfully seeded database with scored stocks!")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding database with sample stocks and fundamentals...\n")
    seed_stocks()
    print("\n✨ Done!")
