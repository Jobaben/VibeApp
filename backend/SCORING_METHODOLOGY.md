# Stock Scoring Methodology

## Overview
This document outlines the rigorous, evidence-based methodology used to score stocks from 0-100 points. This system is designed for **educational and research purposes** and should not be the sole basis for investment decisions.

## Important Disclaimers
⚠️ **This is NOT financial advice**
- Scores are based on historical data and ratios
- Past performance does not guarantee future results
- All investments carry risk of loss
- Consult a qualified financial advisor before making investment decisions
- This tool is for research and educational purposes only

## Scoring Framework

### Total Score: 0-100 Points
Composed of four equal-weighted factors (25 points each):
1. **Value Score** - Is the stock cheap relative to fundamentals?
2. **Quality Score** - Does the business generate strong returns?
3. **Momentum Score** - Is the stock trending in the right direction?
4. **Financial Health Score** - Can the company weather storms?

---

## 1. Value Score (0-25 points)

**Philosophy:** Pay a fair price for quality. Overpaying destroys returns even for great businesses.

### Components:

#### A) P/E Ratio vs Sector (8 points)
- **Metric:** Price-to-Earnings ratio relative to sector average
- **Scoring:**
  - P/E < 50% of sector avg: 8 pts (deeply undervalued)
  - P/E < 75% of sector avg: 6 pts (undervalued)
  - P/E = 75-125% of sector avg: 4 pts (fairly valued)
  - P/E > 125% of sector avg: 2 pts (expensive)
  - P/E > 200% of sector avg: 0 pts (very expensive)
- **Handling edge cases:**
  - Negative P/E (losses): 0 pts
  - No sector data: Use all-stock average
  - Growth stocks: Consider PEG ratio

#### B) EV/EBITDA vs Sector (6 points)
- **Metric:** Enterprise Value to EBITDA ratio
- **Rationale:** Better than P/E for companies with different capital structures
- **Scoring:**
  - EV/EBITDA < 60% of sector avg: 6 pts
  - EV/EBITDA < 85% of sector avg: 4 pts
  - EV/EBITDA = 85-115% of sector avg: 3 pts
  - EV/EBITDA > 115% of sector avg: 1 pt
  - EV/EBITDA > 200% of sector avg: 0 pts

#### C) PEG Ratio (6 points)
- **Metric:** P/E to Growth ratio (Peter Lynch's favorite)
- **Philosophy:** Growth justifies higher P/E, but there's a limit
- **Scoring:**
  - PEG < 0.5: 6 pts (steal)
  - PEG = 0.5-1.0: 5 pts (excellent)
  - PEG = 1.0-1.5: 4 pts (good)
  - PEG = 1.5-2.0: 2 pts (fair)
  - PEG > 2.0: 0 pts (expensive)
- **Edge cases:**
  - Negative growth: PEG meaningless, score 0
  - Very high P/E (>50) even with growth: cap at 2 pts

#### D) P/B Ratio Context (5 points)
- **Metric:** Price-to-Book value
- **Philosophy:** Asset-based valuation, sector-dependent
- **Scoring (tech/services):**
  - P/B < 2: 5 pts
  - P/B = 2-5: 3 pts
  - P/B > 5: 1 pt
- **Scoring (asset-heavy: banks, industrials):**
  - P/B < 0.8: 5 pts (deep value)
  - P/B = 0.8-1.2: 4 pts
  - P/B = 1.2-2.0: 2 pts
  - P/B > 2.0: 0 pts

---

## 2. Quality Score (0-25 points)

**Philosophy:** Quality compounds. High-return businesses create wealth over time.

#### A) ROIC Percentile (10 points)
- **Metric:** Return on Invested Capital vs all stocks
- **Rationale:** Best measure of capital efficiency (Buffett's favorite)
- **Scoring:**
  - Top 10% (ROIC >25%): 10 pts
  - Top 25% (ROIC >18%): 8 pts
  - Top 50% (ROIC >12%): 5 pts
  - Bottom 50% (ROIC 6-12%): 3 pts
  - Bottom 25% (ROIC <6%): 0 pts
- **Why ROIC?**
  - Shows how well management deploys capital
  - More important than profit margins
  - Harder to manipulate than EPS

#### B) ROE vs Sector (7 points)
- **Metric:** Return on Equity relative to sector
- **Scoring:**
  - ROE > 150% of sector avg: 7 pts (exceptional)
  - ROE > 125% of sector avg: 5 pts (excellent)
  - ROE = 75-125% of sector avg: 3 pts (average)
  - ROE < 75% of sector avg: 1 pt (poor)
  - ROE < 0: 0 pts (losing money)

#### C) Margin Stability & Quality (5 points)
- **Metric:** Net margin level + consistency
- **Scoring:**
  - Net margin >20% + stable: 5 pts (excellent)
  - Net margin 15-20% + stable: 4 pts (good)
  - Net margin 10-15%: 3 pts (decent)
  - Net margin 5-10%: 2 pts (thin)
  - Net margin <5%: 1 pt (concerning)
  - Negative margin: 0 pts
- **Stability bonus:** +1 pt if improving trend (not implemented yet)

#### D) Free Cash Flow Consistency (3 points)
- **Metric:** FCF Yield
- **Philosophy:** Cash is king. Earnings can be manipulated, cash can't.
- **Scoring:**
  - FCF Yield >8%: 3 pts (excellent)
  - FCF Yield 5-8%: 2 pts (good)
  - FCF Yield 2-5%: 1 pt (okay)
  - FCF Yield <2%: 0 pts (weak)
  - Negative FCF: 0 pts (red flag)

---

## 3. Momentum Score (0-25 points)

**Philosophy:** Don't fight the tape. Wait for confirmation before buying.

**NOTE:** For MVP, we don't have price history, so momentum score defaults to neutral (12.5 pts).
This will be implemented in Phase 4 when we add historical price data.

#### A) Price vs 50-Day MA (7 points) - *Coming in Phase 4*
- Above 50-day MA: positive trend
- Scoring:
  - Price >10% above MA: 7 pts (strong uptrend)
  - Price 5-10% above: 5 pts (uptrend)
  - Price -5% to +5% of MA: 4 pts (neutral)
  - Price 5-10% below: 2 pts (downtrend)
  - Price >10% below: 0 pts (falling knife)

#### B) Price vs 200-Day MA (7 points) - *Coming in Phase 4*
- Above 200-day MA: long-term uptrend
- Scoring similar to 50-day MA

#### C) RSI (6 points) - *Coming in Phase 4*
- **Metric:** Relative Strength Index (14-day)
- **Philosophy:** Avoid overbought/oversold extremes
- **Scoring:**
  - RSI 45-60 (optimal): 6 pts
  - RSI 60-70 or 40-45: 4 pts
  - RSI 30-40 or 70-80: 2 pts
  - RSI <30 or >80: 0 pts (extreme)

#### D) Volume Trend (5 points) - *Coming in Phase 4*
- Increasing volume on up days = healthy
- Scoring based on volume patterns

---

## 4. Financial Health Score (0-25 points)

**Philosophy:** Survive to thrive. Weak balance sheets kill companies in downturns.

#### A) Debt/Equity Ratio (10 points)
- **Metric:** Total debt relative to equity
- **Philosophy:** Too much debt = bankruptcy risk
- **Scoring (non-financial):**
  - D/E < 0.3: 10 pts (fortress balance sheet)
  - D/E = 0.3-0.5: 8 pts (conservative)
  - D/E = 0.5-1.0: 5 pts (moderate)
  - D/E = 1.0-2.0: 2 pts (concerning)
  - D/E > 2.0: 0 pts (dangerous)
- **Sector adjustment:**
  - Utilities, REITs: naturally higher D/E acceptable
  - Banks: use different metrics

#### B) Current Ratio (6 points)
- **Metric:** Current assets / current liabilities
- **Philosophy:** Can they pay bills in next 12 months?
- **Scoring:**
  - Current ratio >2.5: 6 pts (very safe)
  - Current ratio 2.0-2.5: 5 pts (safe)
  - Current ratio 1.5-2.0: 4 pts (adequate)
  - Current ratio 1.0-1.5: 2 pts (tight)
  - Current ratio <1.0: 0 pts (liquidity crisis)
- **Exceptions:** Banks excluded (different business model)

#### C) Interest Coverage (5 points)
- **Metric:** EBIT / Interest expense
- **Philosophy:** Can they afford their debt service?
- **Scoring:**
  - Coverage >10x: 5 pts (no problem)
  - Coverage 5-10x: 4 pts (comfortable)
  - Coverage 3-5x: 3 pts (okay)
  - Coverage 1.5-3x: 1 pt (risky)
  - Coverage <1.5x: 0 pts (in trouble)

#### D) FCF Yield (4 points)
- **Metric:** Free Cash Flow / Market Cap
- **Philosophy:** Are they generating cash relative to valuation?
- **Scoring:**
  - FCF Yield >8%: 4 pts
  - FCF Yield 5-8%: 3 pts
  - FCF Yield 3-5%: 2 pts
  - FCF Yield 1-3%: 1 pt
  - FCF Yield <1%: 0 pts

---

## Signal Classification

Based on total score (0-100):

| Score Range | Signal | Color | Meaning |
|-------------|--------|-------|---------|
| 90-100 | STRONG BUY | 🟢 | Exceptional opportunity - rare! |
| 75-89 | BUY | 🟢 | Attractive investment candidate |
| 50-74 | HOLD | 🟡 | Neutral - wait for better entry or hold if owned |
| 25-49 | SELL | 🔴 | Warning signs - avoid or exit |
| 0-24 | STRONG SELL | 🔴 | Major problems - stay away |

### Signal Interpretation Guidelines:

**STRONG BUY (90-100):**
- All 4 factors are strong
- Rare occurrence (expect <5% of stocks)
- Still requires due diligence
- Consider: Why is this opportunity available?

**BUY (75-89):**
- 3 or more factors are strong
- One factor may be weak but not critical
- Good risk/reward
- Expected: 10-15% of stocks

**HOLD (50-74):**
- Mixed signals
- Some strengths, some weaknesses
- Not compelling at current price
- Expected: 50-60% of stocks

**SELL (25-49):**
- Significant weaknesses in 2+ areas
- Better opportunities elsewhere
- If owned, consider exiting
- Expected: 20-25% of stocks

**STRONG SELL (0-24):**
- Multiple critical problems
- High risk of permanent capital loss
- Avoid entirely
- Expected: 5-10% of stocks

---

## Handling Edge Cases

### Missing Data
- If a metric is missing (null), assign neutral score (50% of max points)
- Example: Missing P/E ratio gets 4 pts out of 8 (neutral)
- Exception: Missing FCF or negative = 0 pts (conservative approach)

### Negative Values
- Negative earnings (P/E): 0 pts on P/E component
- Negative growth (PEG): 0 pts on PEG component
- Negative margins: 0 pts on margin components
- Negative FCF: 0 pts (red flag)

### Outliers
- Cap maximum ratios to avoid distortion:
  - P/E > 100: treat as 100
  - ROE > 200%: treat as 200% (Apple-like)
  - Debt/Equity > 5: treat as 5

### Sector-Specific Adjustments

**Banks/Financial Services:**
- Ignore current ratio (not applicable)
- Debt/Equity not meaningful (debt is product)
- Focus more on ROE, net margin, asset quality

**Utilities:**
- Higher D/E is normal (capital intensive)
- Accept D/E up to 2.0 as reasonable

**Technology:**
- P/B ratio less meaningful (intangible assets)
- Focus on gross margins, R&D efficiency

**REITs:**
- High debt normal (leveraged real estate)
- Focus on FFO, not earnings

---

## Validation & Testing

### Sanity Checks
Before production, we validate that:
1. **Known quality stocks score high**: Microsoft, Google, Visa should score 75+
2. **Troubled stocks score low**: Disney (turnaround), Intel (declining) should score 40-60
3. **High-dividend stocks** (JPM, PFE, CSCO) score well on health
4. **Growth stocks** (NVDA, TSLA, AMZN) score well despite high P/E (PEG ratio helps)
5. **Value traps avoided**: Low P/E + poor quality should NOT score high

### Known Limitations
1. **No forward-looking data**: Based on historical metrics only
2. **No qualitative factors**: Management quality, competitive moats, industry trends
3. **No macro context**: Interest rates, economic cycle, sector rotation
4. **Backward-looking**: Metrics lag current reality
5. **Sector bias**: Some sectors naturally score higher (tech vs utilities)

### Recommended Use
✅ **DO:**
- Use as a starting point for research
- Compare stocks within same sector
- Track score changes over time
- Validate with your own analysis
- Consider score alongside other factors

❌ **DON'T:**
- Make investment decisions based solely on score
- Assume high score = guaranteed returns
- Ignore qualitative factors
- Use for short-term trading
- Rely on without understanding methodology

---

## References & Research

This methodology draws from:
- **Value investing**: Benjamin Graham, Warren Buffett (P/E, P/B, margin of safety)
- **Quality investing**: Charlie Munger (ROIC, moats, quality compounds)
- **Growth investing**: Peter Lynch (PEG ratio, growth at reasonable price)
- **Financial analysis**: Aswath Damodaran (valuation, sector context)
- **Risk management**: Howard Marks (debt, liquidity, downside protection)

### Academic Research
- Fama-French 3-factor model (value, size, market)
- Quality factor research (Novy-Marx, Asness)
- Momentum factor (Jegadeesh, Titman)

---

## Version History
- **v1.0** (2025-10-25): Initial methodology for Phase 3
- Focus on fundamental factors only
- Momentum scoring deferred to Phase 4 (need price history)

---

## Contact & Feedback
This is a living document. Methodology may be refined based on:
- Backtesting results
- User feedback
- Market conditions
- Academic research updates

**Remember:** This tool is for educational purposes. Always do your own research and consult a financial professional before investing.
