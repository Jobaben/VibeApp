"""
Sector averages calculation and caching service.

This module calculates benchmark metrics for each sector to enable
peer comparison in the scoring system.
"""
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from app.features.stocks.models import Stock, StockFundamental, SectorAverage
from app.features.stocks.services.scoring_service import SectorBenchmarks


class SectorService:
    """Service for calculating and managing sector average metrics."""

    def __init__(self, db: Session):
        self.db = db

    def calculate_and_cache_sector_averages(self) -> Dict[str, SectorBenchmarks]:
        """
        Calculate average metrics for each sector and cache in database.

        Returns:
            Dictionary mapping sector name to SectorBenchmarks
        """
        # Get all stocks with fundamentals grouped by sector
        sectors_data = self._get_sector_data()

        sector_benchmarks = {}

        for sector, stocks_fundamentals in sectors_data.items():
            if not stocks_fundamentals:
                continue

            # Calculate averages
            benchmarks = self._calculate_sector_benchmarks(sector, stocks_fundamentals)
            sector_benchmarks[sector] = benchmarks

            # Cache in database
            self._cache_sector_average(benchmarks)

        self.db.commit()
        return sector_benchmarks

    def get_cached_sector_benchmarks(self) -> Dict[str, SectorBenchmarks]:
        """
        Retrieve sector benchmarks from cache (database).

        Returns:
            Dictionary mapping sector name to SectorBenchmarks
        """
        cached = self.db.query(SectorAverage).all()

        benchmarks = {}
        for ca in cached:
            benchmarks[ca.sector] = SectorBenchmarks(
                sector=ca.sector,
                avg_pe=float(ca.avg_pe) if ca.avg_pe else None,
                avg_ev_ebitda=float(ca.avg_ev_ebitda) if ca.avg_ev_ebitda else None,
                avg_roic=float(ca.avg_roic) if ca.avg_roic else None,
                avg_roe=float(ca.avg_roe) if ca.avg_roe else None,
                avg_debt_equity=float(ca.avg_debt_equity) if ca.avg_debt_equity else None,
                avg_gross_margin=float(ca.avg_gross_margin) if ca.avg_gross_margin else None,
                avg_operating_margin=float(ca.avg_operating_margin) if ca.avg_operating_margin else None,
                avg_net_margin=float(ca.avg_net_margin) if ca.avg_net_margin else None,
                stock_count=ca.stock_count,
            )

        return benchmarks

    def _get_sector_data(self) -> Dict[str, List[StockFundamental]]:
        """Group stocks by sector with their fundamentals."""
        # Query stocks with their fundamentals
        stocks = (
            self.db.query(Stock)
            .join(StockFundamental, Stock.id == StockFundamental.stock_id)
            .filter(Stock.sector.isnot(None))
            .all()
        )

        # Group by sector
        sectors = {}
        for stock in stocks:
            if stock.sector and stock.fundamentals:
                if stock.sector not in sectors:
                    sectors[stock.sector] = []
                sectors[stock.sector].append(stock.fundamentals)

        return sectors

    def _calculate_sector_benchmarks(
        self,
        sector: str,
        fundamentals: List[StockFundamental]
    ) -> SectorBenchmarks:
        """Calculate average metrics for a sector."""

        # Helper to calculate average, excluding None and outliers
        def safe_avg(values: List[float], max_val: float = None) -> float:
            valid = [v for v in values if v is not None and v > 0]
            if not valid:
                return None

            # Remove outliers if max_val specified
            if max_val:
                valid = [v for v in valid if v <= max_val]

            return sum(valid) / len(valid) if valid else None

        # Extract values
        pe_values = [float(f.pe_ratio) if f.pe_ratio else None for f in fundamentals]
        ev_ebitda_values = [float(f.ev_ebitda) if f.ev_ebitda else None for f in fundamentals]
        roic_values = [float(f.roic) if f.roic else None for f in fundamentals]
        roe_values = [float(f.roe) if f.roe else None for f in fundamentals]
        de_values = [float(f.debt_equity) if f.debt_equity else None for f in fundamentals]
        gross_margin_values = [float(f.gross_margin) if f.gross_margin else None for f in fundamentals]
        op_margin_values = [float(f.operating_margin) if f.operating_margin else None for f in fundamentals]
        net_margin_values = [float(f.net_margin) if f.net_margin else None for f in fundamentals]

        # Calculate averages with outlier removal
        return SectorBenchmarks(
            sector=sector,
            avg_pe=safe_avg(pe_values, max_val=100),  # Cap P/E at 100
            avg_ev_ebitda=safe_avg(ev_ebitda_values, max_val=100),
            avg_roic=safe_avg(roic_values, max_val=200),  # Cap ROIC at 200%
            avg_roe=safe_avg(roe_values, max_val=200),
            avg_debt_equity=safe_avg(de_values, max_val=5),  # Cap D/E at 5
            avg_gross_margin=safe_avg(gross_margin_values, max_val=100),
            avg_operating_margin=safe_avg(op_margin_values, max_val=100),
            avg_net_margin=safe_avg(net_margin_values, max_val=100),
            stock_count=len(fundamentals),
        )

    def _cache_sector_average(self, benchmarks: SectorBenchmarks):
        """Cache sector benchmarks in database."""
        # Check if exists
        existing = (
            self.db.query(SectorAverage)
            .filter(SectorAverage.sector == benchmarks.sector)
            .first()
        )

        if existing:
            # Update existing
            existing.avg_pe = Decimal(str(benchmarks.avg_pe)) if benchmarks.avg_pe else None
            existing.avg_ev_ebitda = Decimal(str(benchmarks.avg_ev_ebitda)) if benchmarks.avg_ev_ebitda else None
            existing.avg_roic = Decimal(str(benchmarks.avg_roic)) if benchmarks.avg_roic else None
            existing.avg_roe = Decimal(str(benchmarks.avg_roe)) if benchmarks.avg_roe else None
            existing.avg_debt_equity = Decimal(str(benchmarks.avg_debt_equity)) if benchmarks.avg_debt_equity else None
            existing.avg_gross_margin = Decimal(str(benchmarks.avg_gross_margin)) if benchmarks.avg_gross_margin else None
            existing.avg_operating_margin = Decimal(str(benchmarks.avg_operating_margin)) if benchmarks.avg_operating_margin else None
            existing.avg_net_margin = Decimal(str(benchmarks.avg_net_margin)) if benchmarks.avg_net_margin else None
            existing.stock_count = benchmarks.stock_count
        else:
            # Create new
            new_avg = SectorAverage(
                sector=benchmarks.sector,
                avg_pe=Decimal(str(benchmarks.avg_pe)) if benchmarks.avg_pe else None,
                avg_ev_ebitda=Decimal(str(benchmarks.avg_ev_ebitda)) if benchmarks.avg_ev_ebitda else None,
                avg_roic=Decimal(str(benchmarks.avg_roic)) if benchmarks.avg_roic else None,
                avg_roe=Decimal(str(benchmarks.avg_roe)) if benchmarks.avg_roe else None,
                avg_debt_equity=Decimal(str(benchmarks.avg_debt_equity)) if benchmarks.avg_debt_equity else None,
                avg_gross_margin=Decimal(str(benchmarks.avg_gross_margin)) if benchmarks.avg_gross_margin else None,
                avg_operating_margin=Decimal(str(benchmarks.avg_operating_margin)) if benchmarks.avg_operating_margin else None,
                avg_net_margin=Decimal(str(benchmarks.avg_net_margin)) if benchmarks.avg_net_margin else None,
                stock_count=benchmarks.stock_count,
            )
            self.db.add(new_avg)

    def calculate_scores_for_all_stocks(self) -> int:
        """
        Calculate scores for all stocks and save to database.

        Returns:
            Number of stocks scored
        """
        from app.features.stocks.services.scoring_service import ScoringService

        # Get sector benchmarks
        sector_benchmarks = self.get_cached_sector_benchmarks()

        # Get all fundamentals for percentile calculations
        all_fundamentals = (
            self.db.query(StockFundamental)
            .join(Stock, Stock.id == StockFundamental.stock_id)
            .all()
        )

        # Initialize scoring service
        scoring_service = ScoringService(all_fundamentals, sector_benchmarks)

        # Get all stocks with fundamentals
        stocks = (
            self.db.query(Stock)
            .join(StockFundamental, Stock.id == StockFundamental.stock_id)
            .all()
        )

        scored_count = 0

        for stock in stocks:
            # Calculate score
            score_breakdown = scoring_service.calculate_score(
                stock.fundamentals,
                stock.sector
            )

            # Save or update score
            from app.features.stocks.models import StockScore

            existing_score = (
                self.db.query(StockScore)
                .filter(StockScore.stock_id == stock.id)
                .first()
            )

            if existing_score:
                # Update existing
                existing_score.total_score = Decimal(str(score_breakdown.total_score))
                existing_score.value_score = Decimal(str(score_breakdown.value_score))
                existing_score.quality_score = Decimal(str(score_breakdown.quality_score))
                existing_score.momentum_score = Decimal(str(score_breakdown.momentum_score))
                existing_score.health_score = Decimal(str(score_breakdown.health_score))
                existing_score.signal = score_breakdown.signal
            else:
                # Create new
                new_score = StockScore(
                    stock_id=stock.id,
                    total_score=Decimal(str(score_breakdown.total_score)),
                    value_score=Decimal(str(score_breakdown.value_score)),
                    quality_score=Decimal(str(score_breakdown.quality_score)),
                    momentum_score=Decimal(str(score_breakdown.momentum_score)),
                    health_score=Decimal(str(score_breakdown.health_score)),
                    signal=score_breakdown.signal,
                )
                self.db.add(new_score)

            scored_count += 1

        self.db.commit()
        return scored_count
