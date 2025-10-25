"""Seed database with sample stock data for development."""
import sys
from pathlib import Path
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.infrastructure.database.session import SessionLocal
from app.features.stocks.models import (
    Stock,
    StockFundamental,
    StockScore,
    InstrumentType,
    Signal
)
from app.features.integrations.mock_stock_data import get_mock_stock_data


def calculate_mock_score(fundamentals_data: dict) -> dict:
    """
    Calculate simple mock scores based on fundamentals.
    This is a placeholder - Phase 3 will implement proper scoring algorithm.
    """
    score = 50  # Base score

    # Add points for good metrics
    if fundamentals_data.get("roic") and fundamentals_data["roic"] > 20:
        score += 10
    if fundamentals_data.get("pe_ratio") and fundamentals_data["pe_ratio"] < 15:
        score += 10
    if fundamentals_data.get("debt_equity") and fundamentals_data["debt_equity"] < 0.5:
        score += 10
    if fundamentals_data.get("revenue_growth") and fundamentals_data["revenue_growth"] > 20:
        score += 10

    # Determine signal
    if score >= 90:
        signal = Signal.STRONG_BUY
    elif score >= 75:
        signal = Signal.BUY
    elif score >= 50:
        signal = Signal.HOLD
    elif score >= 25:
        signal = Signal.SELL
    else:
        signal = Signal.STRONG_SELL

    return {
        "total_score": Decimal(str(score)),
        "value_score": Decimal(str(score * 0.25)),
        "quality_score": Decimal(str(score * 0.25)),
        "momentum_score": Decimal(str(score * 0.25)),
        "health_score": Decimal(str(score * 0.25)),
        "signal": signal
    }


def seed_stocks():
    """Seed the database with sample stocks and fundamentals."""
    db = SessionLocal()

    try:
        # Get enhanced mock stock data with fundamentals
        mock_stocks = get_mock_stock_data()

        print(f"Seeding {len(mock_stocks)} stocks with fundamentals...\n")

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

                # Create mock scores based on fundamentals
                score_data = calculate_mock_score(stock_data)
                score = StockScore(
                    stock_id=stock.id,
                    total_score=score_data["total_score"],
                    value_score=score_data["value_score"],
                    quality_score=score_data["quality_score"],
                    momentum_score=score_data["momentum_score"],
                    health_score=score_data["health_score"],
                    signal=score_data["signal"],
                )
                db.add(score)

                print(f"  ✅ Added {stock.ticker} - {stock.name} (Score: {score_data['total_score']}, Signal: {score_data['signal'].value})")
            else:
                print(f"  ✅ Added {stock.ticker} - {stock.name} (no fundamentals)")

        db.commit()
        print(f"\n✅ Successfully seeded {len(mock_stocks)} stocks with fundamentals!")

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
