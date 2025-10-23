"""Unit tests for Pydantic schemas."""
import pytest
from pydantic import ValidationError
from datetime import datetime

from app.features.ai.schemas import (
    AIInsight,
    ScoreBreakdown,
    Fundamentals,
    SectorComparison,
    Technicals,
    StockAnalysis,
    MarketContext,
    AISummary,
    AIAnalysisResponse,
    DeepAnalysisResponse,
    ComparisonResponse,
    AnalysisCriteria,
)


class TestAIInsightSchema:
    """Test AIInsight schema validation."""

    def test_ai_insight_valid(self):
        """Test valid AIInsight creation."""
        insight = AIInsight(
            strengths=["Strong ROIC", "Low debt"],
            weaknesses=["High P/E"],
            catalyst_watch=["Earnings report"]
        )

        assert len(insight.strengths) == 2
        assert len(insight.weaknesses) == 1
        assert len(insight.catalyst_watch) == 1

    def test_ai_insight_empty_catalyst_watch(self):
        """Test AIInsight with empty catalyst_watch (default)."""
        insight = AIInsight(
            strengths=["Strong ROIC"],
            weaknesses=["High P/E"]
        )

        assert insight.catalyst_watch == []

    def test_ai_insight_requires_strengths_and_weaknesses(self):
        """Test AIInsight requires strengths and weaknesses."""
        with pytest.raises(ValidationError):
            AIInsight(catalyst_watch=["Something"])


class TestScoreBreakdownSchema:
    """Test ScoreBreakdown schema validation."""

    def test_score_breakdown_valid(self):
        """Test valid ScoreBreakdown creation."""
        score = ScoreBreakdown(
            total=82,
            value=20,
            quality=22,
            momentum=18,
            health=22
        )

        assert score.total == 82
        assert score.value + score.quality + score.momentum + score.health == 82

    def test_score_breakdown_total_range_validation(self):
        """Test total score must be 0-100."""
        # Valid range
        ScoreBreakdown(total=0, value=0, quality=0, momentum=0, health=0)
        ScoreBreakdown(total=100, value=25, quality=25, momentum=25, health=25)

        # Invalid: too high
        with pytest.raises(ValidationError):
            ScoreBreakdown(total=101, value=25, quality=25, momentum=25, health=26)

        # Invalid: negative
        with pytest.raises(ValidationError):
            ScoreBreakdown(total=-1, value=0, quality=0, momentum=0, health=0)

    def test_score_breakdown_component_range_validation(self):
        """Test component scores must be 0-25."""
        # Valid
        ScoreBreakdown(total=75, value=25, quality=20, momentum=15, health=15)

        # Invalid: value too high
        with pytest.raises(ValidationError):
            ScoreBreakdown(total=80, value=26, quality=20, momentum=20, health=14)

        # Invalid: negative
        with pytest.raises(ValidationError):
            ScoreBreakdown(total=75, value=-1, quality=25, momentum=25, health=26)


class TestFundamentalsSchema:
    """Test Fundamentals schema validation."""

    def test_fundamentals_all_fields(self):
        """Test Fundamentals with all fields."""
        fundamentals = Fundamentals(
            pe_ratio=12.5,
            ev_ebitda=8.2,
            peg=1.3,
            pb_ratio=2.1,
            ps_ratio=0.8,
            roic=18.5,
            roe=22.3,
            gross_margin=28.5,
            operating_margin=14.2,
            net_margin=9.8,
            debt_equity=0.45,
            current_ratio=1.8,
            fcf_yield=6.2,
            interest_coverage=8.5
        )

        assert fundamentals.pe_ratio == 12.5
        assert fundamentals.roic == 18.5

    def test_fundamentals_optional_fields(self):
        """Test Fundamentals with only some fields."""
        fundamentals = Fundamentals(
            pe_ratio=12.5,
            roic=18.5
        )

        assert fundamentals.pe_ratio == 12.5
        assert fundamentals.roic == 18.5
        assert fundamentals.ev_ebitda is None

    def test_fundamentals_all_optional(self):
        """Test all Fundamental fields are optional."""
        fundamentals = Fundamentals()

        assert fundamentals.pe_ratio is None
        assert fundamentals.roic is None


class TestSectorComparisonSchema:
    """Test SectorComparison schema validation."""

    def test_sector_comparison_valid(self):
        """Test valid SectorComparison creation."""
        comparison = SectorComparison(
            pe_percentile=65,
            roic_percentile=78,
            roe_percentile=72
        )

        assert comparison.pe_percentile == 65

    def test_sector_comparison_percentile_range(self):
        """Test percentiles must be 0-100."""
        # Valid
        SectorComparison(pe_percentile=0, roic_percentile=100, roe_percentile=50)

        # Invalid: too high
        with pytest.raises(ValidationError):
            SectorComparison(pe_percentile=101)

        # Invalid: negative
        with pytest.raises(ValidationError):
            SectorComparison(roic_percentile=-1)

    def test_sector_comparison_all_optional(self):
        """Test all fields are optional."""
        comparison = SectorComparison()

        assert comparison.pe_percentile is None


class TestTechnicalsSchema:
    """Test Technicals schema validation."""

    def test_technicals_valid(self):
        """Test valid Technicals creation."""
        technicals = Technicals(
            rsi=58.5,
            price_vs_50ma=1.05,
            price_vs_200ma=1.12,
            trend="uptrend"
        )

        assert technicals.rsi == 58.5
        assert technicals.trend == "uptrend"

    def test_technicals_all_optional(self):
        """Test all fields are optional."""
        technicals = Technicals()

        assert technicals.rsi is None
        assert technicals.trend is None


class TestStockAnalysisSchema:
    """Test StockAnalysis schema validation."""

    def test_stock_analysis_complete(self, mock_stock_data):
        """Test complete StockAnalysis creation."""
        stock = StockAnalysis(**mock_stock_data)

        assert stock.ticker == "VOLV-B"
        assert stock.name == "Volvo Group"
        assert stock.scores.total == 82
        assert stock.signal == "BUY"

    def test_stock_analysis_minimal(self):
        """Test StockAnalysis with minimal required fields."""
        stock = StockAnalysis(
            ticker="TEST",
            name="Test Stock",
            price=100.0,
            scores=ScoreBreakdown(total=50, value=12, quality=13, momentum=12, health=13),
            signal="HOLD",
            fundamentals=Fundamentals(),
            ai_insights=AIInsight(strengths=["A"], weaknesses=["B"])
        )

        assert stock.ticker == "TEST"
        assert stock.instrument_type == "STOCK"  # default value

    def test_stock_analysis_requires_core_fields(self):
        """Test StockAnalysis requires essential fields."""
        with pytest.raises(ValidationError):
            StockAnalysis(ticker="TEST", name="Test")  # Missing required fields


class TestMarketContextSchema:
    """Test MarketContext schema validation."""

    def test_market_context_valid(self):
        """Test valid MarketContext creation."""
        context = MarketContext(
            timestamp=datetime.now(),
            market_avg_pe=18.5,
            market_avg_roic=12.3,
            market_avg_roe=15.2
        )

        assert context.market_avg_pe == 18.5

    def test_market_context_timestamp_required(self):
        """Test MarketContext requires timestamp."""
        with pytest.raises(ValidationError):
            MarketContext(market_avg_pe=18.5)


class TestAISummarySchema:
    """Test AISummary schema validation."""

    def test_ai_summary_valid(self):
        """Test valid AISummary creation."""
        summary = AISummary(
            key_findings="Found 10 excellent stocks",
            sector_distribution={"Industrials": 5, "Technology": 3, "Financials": 2},
            avg_score=78.5,
            best_opportunity="VOLV-B",
            highest_risk="HM-B"
        )

        assert summary.key_findings == "Found 10 excellent stocks"
        assert summary.avg_score == 78.5

    def test_ai_summary_optional_fields(self):
        """Test AISummary with optional fields omitted."""
        summary = AISummary(
            key_findings="No stocks found",
            sector_distribution={},
            avg_score=0.0
        )

        assert summary.best_opportunity is None
        assert summary.highest_risk is None


class TestAIAnalysisResponseSchema:
    """Test AIAnalysisResponse schema validation."""

    def test_ai_analysis_response_valid(self, mock_stock_data):
        """Test valid AIAnalysisResponse creation."""
        response = AIAnalysisResponse(
            query_metadata={
                "timestamp": datetime.now().isoformat(),
                "total_results": 1,
                "criteria_used": {},
                "limit": 50
            },
            market_context=MarketContext(
                timestamp=datetime.now(),
                market_avg_pe=18.5
            ),
            stocks=[StockAnalysis(**mock_stock_data)],
            ai_summary=AISummary(
                key_findings="Found 1 stock",
                sector_distribution={"Industrials": 1},
                avg_score=82.0
            )
        )

        assert len(response.stocks) == 1
        assert response.stocks[0].ticker == "VOLV-B"


class TestDeepAnalysisResponseSchema:
    """Test DeepAnalysisResponse schema validation."""

    def test_deep_analysis_response_valid(self, mock_stock_data):
        """Test valid DeepAnalysisResponse creation."""
        response = DeepAnalysisResponse(
            stock=StockAnalysis(**mock_stock_data),
            historical_trends={
                "roic_history": [15.2, 16.8, 18.5],
                "margin_history": [8.5, 9.2, 9.8]
            },
            peer_comparison=None
        )

        assert response.stock.ticker == "VOLV-B"
        assert len(response.historical_trends["roic_history"]) == 3

    def test_deep_analysis_with_peers(self, mock_stock_data):
        """Test DeepAnalysisResponse with peer comparison."""
        response = DeepAnalysisResponse(
            stock=StockAnalysis(**mock_stock_data),
            historical_trends={},
            peer_comparison=[StockAnalysis(**mock_stock_data)]
        )

        assert len(response.peer_comparison) == 1


class TestComparisonResponseSchema:
    """Test ComparisonResponse schema validation."""

    def test_comparison_response_valid(self, mock_stock_data):
        """Test valid ComparisonResponse creation."""
        response = ComparisonResponse(
            stocks=[
                StockAnalysis(**mock_stock_data),
                StockAnalysis(**mock_stock_data)
            ],
            comparison_matrix={
                "highest_roic": {"ticker": "VOLV-B", "value": 18.5},
                "lowest_pe": {"ticker": "SCVB", "value": 12.5}
            }
        )

        assert len(response.stocks) == 2
        assert "highest_roic" in response.comparison_matrix


class TestAnalysisCriteriaSchema:
    """Test AnalysisCriteria schema validation."""

    def test_analysis_criteria_all_fields(self):
        """Test AnalysisCriteria with all fields."""
        criteria = AnalysisCriteria(
            min_pe=5.0,
            max_pe=20.0,
            min_roic=15.0,
            min_roe=10.0,
            max_debt_equity=0.5,
            min_fcf_yield=5.0,
            sectors=["Industrials", "Technology"],
            min_market_cap=1000000000,
            max_market_cap=10000000000,
            min_price=50.0,
            max_price=500.0,
            instrument_types=["STOCK", "ETF"]
        )

        assert criteria.min_pe == 5.0
        assert len(criteria.sectors) == 2

    def test_analysis_criteria_all_optional(self):
        """Test all AnalysisCriteria fields are optional."""
        criteria = AnalysisCriteria()

        assert criteria.min_pe is None
        assert criteria.sectors is None

    def test_analysis_criteria_partial(self):
        """Test AnalysisCriteria with only some fields."""
        criteria = AnalysisCriteria(
            min_roic=15.0,
            max_pe=20.0
        )

        assert criteria.min_roic == 15.0
        assert criteria.max_pe == 20.0
        assert criteria.sectors is None
