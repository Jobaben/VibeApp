---
title: Free Brokerage & Stock-Data APIs — Sweden, Personal Portfolio Dashboard
date: 2026-05-11
audience: Solo developer, Sweden, Python + REST, delayed (15-min) data acceptable
budget: $0/month
status: research-complete
---

# Free Brokerage & Stock-Data APIs for a Personal Portfolio Dashboard (Sweden, 2026)

Compiled 2026-05-11. Every claim about a free tier was verified against a primary source (provider's own pricing/docs page) or, where the provider's page was light on detail, a second independent source. Where I could not confirm, the entry is marked **unverified**.

**Your context as I scoped this:**
- Location: Sweden (EU)
- Goal: personal portfolio dashboard (read-only quotes + holdings, not order placement)
- Tech: Python + REST
- Data freshness: 15-minute delayed is fine
- Budget: $0/month, no hidden upgrade required for the core use case

The 15-min-delayed constraint is the one that opens up the most realistic options. Almost every "free" provider paywalls real-time SIP and pushes you to delayed IEX or end-of-day. For a personal dashboard you almost never actually need sub-second quotes.

---

## TL;DR — what I'd actually use

1. **Quotes + fundamentals + history → Finnhub free tier** (60 req/min, US real-time-ish, fundamentals included, personal-use license). Best generosity-to-cost ratio of any free data API still standing.
2. **Long historical EOD → Tiingo free tier** (30+ years of US EOD, 50 symbols/hour). Pair with Finnhub if you outgrow a single source.
3. **Your actual holdings (Swedish broker)** → if you have **Nordnet**, use their official **External API** (Swedish customers only, free with an account). If you have **Avanza**, the only option is an unofficial community Python wrapper at ToS risk. If you have **Interactive Brokers Sweden**, use the **TWS / Web API** (free with a funded account, no minimum, no inactivity fee).
4. **Don't build production code on `yfinance`.** It still works most of the time, but it's an unofficial scraper that gets 429-throttled regularly and has no SLA. Fine as a fallback or for one-off exploration, dangerous as a dashboard's primary data source.

Full reasoning below.

---

## Section 1 — Data-only APIs (quotes, fundamentals, history; no order placement)

### 1.1 Finnhub — **Recommended primary**

| Item | Value |
|---|---|
| Free rate limit | **60 API calls / minute** ([finnhub.io/docs/api/rate-limit](https://finnhub.io/docs/api/rate-limit)) |
| Data freshness | Real-time for US, ~20-minute delayed elsewhere on free tier ([secondary source](https://medium.com/coinmonks/the-7-best-real-time-stock-data-apis-for-investors-and-developers-in-2026-in-depth-analysis-61614dc9bf6c)) |
| History | Recent only — deep historical backtesting requires paid tier (secondary source) |
| Fundamentals | Basic fundamentals on free; full statements & international markets paywalled (secondary source) |
| License | Personal / non-commercial only on free tier (secondary source) |
| EU/Sweden | No regional restriction; HTTPS REST endpoint reachable from EU |
| Python client | `finnhub-python` (official) |
| Catch | Personal-use license means you can't put a free-tier dashboard on the public internet for others to use. |

**Why it tops the list**: 60 req/min is dramatically more generous than Alpha Vantage (5/min), Twelve Data (8/min), or Polygon (5/min). For a personal dashboard polling 50 tickers every minute you'd never hit the cap.

### 1.2 Tiingo — **Recommended for deep history**

| Item | Value |
|---|---|
| Free rate limit | **50 unique symbols / hour**, **1000 requests / day** on the IEX real-time endpoint ([tiingo.com/about/pricing](https://www.tiingo.com/about/pricing)) |
| Data freshness | EOD covers 30+ years; intraday/real-time via IEX partnership ([tiingo.com/products/iex-api](https://www.tiingo.com/products/iex-api)) |
| History | **30+ years** of EOD US stock data on free tier — exceptionally deep for free ([Find My Moat review](https://www.findmymoat.com/tools/tiingo)) |
| Fundamentals | **Not included on free tier** — fundamentals & news are paywalled ([Find My Moat](https://www.findmymoat.com/tools/tiingo)) |
| License | Internal personal use only ([tiingo.com/about/pricing](https://www.tiingo.com/about/pricing)) |
| EU/Sweden | No regional restriction |
| Python client | `tiingo` (community) |
| Catch | The "50 symbols/hour" cap is per *unique* symbol, which means if your portfolio is small (<50 tickers) it's plenty — but you can't sweep large universes on free. |

**Why include it alongside Finnhub**: deepest free EOD history I could verify, which matters if you want lifetime portfolio P&L charts or long-window comparisons.

### 1.3 Twelve Data — Reasonable third option

| Item | Value |
|---|---|
| Free rate limit | **8 calls / minute, 800 / day** ([twelvedata.com/pricing](https://twelvedata.com/pricing)) |
| Data freshness | Real-time US equities, forex, crypto on free ([twelvedata.com/pricing](https://twelvedata.com/pricing)) |
| History | Available, depth varies per endpoint (unverified specifics) |
| WebSocket | 8 trial credits only on free tier ([twelvedata.com/pricing](https://twelvedata.com/pricing)) |
| EU/Sweden | No regional restriction |
| Python client | `twelvedata` (official) |
| Catch | 800/day is the binding constraint — at 50 tickers updating every 5 min during US market hours you'd burn through it. |

### 1.4 Alpha Vantage — Skip unless single-asset use

| Item | Value |
|---|---|
| Free rate limit | **25 requests / day**, 5/min ([alphavantage.co/premium](https://www.alphavantage.co/premium/), confirmed by [Macroption](https://www.macroption.com/alpha-vantage-api-limits/)) |
| Degradation history | 500/day → 100/day → **25/day** — three step-down cuts, no public explanation (NASDAQ licensing pressure is the likely driver, per [community analysis](https://www.findmymoat.com/tools/alpha-vantage)) |
| Catch | At 25 calls/day this is effectively a hobby toy. One dashboard refresh that touches 26 endpoints fails. |

This is the canonical example of "free tier silently degraded" that your prompt asked me to flag. It used to be the go-to free API; it isn't anymore.

### 1.5 Financial Modeling Prep (FMP) — OK for daily-refresh dashboards

| Item | Value |
|---|---|
| Free rate limit | **250 calls / day**, 500 MB / 30 days bandwidth ([site.financialmodelingprep.com/pricing-plans](https://site.financialmodelingprep.com/pricing-plans)) |
| Data freshness | **End-of-day only** on free tier — no intraday |
| History | ~5 years on free |
| Markets | US-only on free |
| Catch | 250 calls/day is fine for a once-a-day refresh, hopeless for anything more frequent. |

### 1.6 Polygon.io — Skip for dashboards

| Item | Value |
|---|---|
| Free rate limit | **5 calls / minute** ([polygon.io](https://polygon.io/)) |
| History | ~2 years on free; 15-min delayed quotes |
| Catch | Same 5/min ceiling as Alpha Vantage but with shorter history. Polygon's value is on paid tiers; free tier is a teaser. |

### 1.7 EODHD — Skip unless very narrow use

| Item | Value |
|---|---|
| Free rate limit | **20 API calls / day** ([eodhd.com/pricing](https://eodhd.com/pricing)) |
| History | 1 year on free, EOD only |
| Catch | Smallest free quota of any provider I checked. Paid tier starts at €19.99/mo. |

### 1.8 Marketstack — Skip

| Item | Value |
|---|---|
| Free rate limit | **100 requests / month** ([marketstack.com/pricing](https://marketstack.com/pricing)) |
| Data | EOD only, 1 year history, US-only |
| Catch | 100/month is roughly 3 calls/day. Not viable for a dashboard. |

### 1.9 Stooq — Not really an API, but useful for bulk history

- **Not an API** — bulk CSV downloads only ([stooq.com/db/h](https://stooq.com/db/h/)).
- 20+ years of EOD for thousands of global symbols via free CSV archives.
- Python access via `pandas_datareader.stooq` ([pandas-datareader docs](https://pandas-datareader.readthedocs.io/en/latest/readers/stooq.html)).
- **Catch**: no programmatic intraday; suitable as a one-off seed dataset, not a live source.

### 1.10 yfinance / Yahoo Finance — Use with caution

- **Not an official API.** Scrapes Yahoo's web endpoints; Ran Aroussi's `yfinance` package is the de-facto Python client.
- **Documented degradation**: `YFRateLimitError` ("Too Many Requests") has been reported across yfinance issues [#2289](https://github.com/ranaroussi/yfinance/issues/2289), [#2411](https://github.com/ranaroussi/yfinance/issues/2411), [#2422](https://github.com/ranaroussi/yfinance/issues/2422), and [discussion #2431](https://github.com/ranaroussi/yfinance/discussions/2431) — still active in 2026.
- Yahoo tightened limits in early 2024 ([analysis](https://medium.com/@trading.dude/why-yfinance-keeps-getting-blocked-and-what-to-use-instead-92d84bb2cc01)). No SLA, no documented rate limit, endpoints change without notice.
- **Catch**: works most days, fails some days, never works reliably under load. Fine as a *fallback* in `yfinance → finnhub → cached EOD` chain; dangerous as your only source.

### 1.11 IEX Cloud — **DEAD**

Retired **2024-08-31** ([iexcloud.org notice](https://iexcloud.org/), [Alpha Vantage migration guide](https://www.alphavantage.co/iexcloud_shutdown_analysis_and_migration/)). Listed here only because your prompt asked me to confirm — yes, it is gone, and any tutorial recommending it is out of date.

---

## Section 2 — Brokerage APIs (can place trades — but more importantly for your goal, expose *your* holdings)

For a portfolio dashboard you need access to your actual positions. That generally means hitting your broker's API directly.

### 2.1 Nordnet External API — **Best option if you bank with Nordnet**

| Item | Value |
|---|---|
| Cost | Free with a funded Nordnet account |
| Availability | **Production access is Swedish customers only** ([nordnet/next-api-v2-examples](https://github.com/nordnet/next-api-v2-examples)) |
| Auth | SSH Ed25519 key + challenge-response ([same source](https://github.com/nordnet/next-api-v2-examples)) |
| Real-time | Yes — covers your own account state and feed access |
| Officially supported | Yes — Nordnet's own GitHub org publishes examples |
| Catch | Setup is heavier than typical REST APIs (key registration, country code). And, despite a JS client existing, **there is no official Python SDK** — you'll be hitting REST yourself. |

This is the most legitimate "free brokerage API in Sweden" answer.

### 2.2 Avanza (unofficial)

- **No official API.** Avanza has not exposed one.
- Multiple community Python wrappers exist — most active is **Qluxzz/avanza** ([github.com/Qluxzz/avanza](https://github.com/Qluxzz/avanza), [PyPI: avanza-api](https://pypi.org/project/avanza-api/)).
- Requires 2FA login (BankID flow).
- **Catch**: explicit "the underlying API can be taken down or changed without warning"; using it may violate Avanza's ToS. Acceptable for personal exploration on your own account at your own risk; do not put it behind a service.

### 2.3 Interactive Brokers (IBKR) — Most powerful, friction-heavy

| Item | Value |
|---|---|
| Cost | **API is free**, included with any funded account ([interactivebrokers.com/en/trading/ib-api.php](https://www.interactivebrokers.com/en/trading/ib-api.php)) |
| Minimum deposit | **$0** ([BrokerChooser fees breakdown](https://brokerchooser.com/broker-reviews/interactive-brokers-review/interactive-brokers-fees)) |
| Inactivity fee | **None** as of 2026 ([same source](https://brokerchooser.com/broker-reviews/interactive-brokers-review/interactive-brokers-fees)) |
| Sweden | Supported (IBKR operates in 220+ countries incl. Sweden) |
| APIs | TWS API (socket, needs gateway running), Web API (REST), FIX, Excel |
| Real-time data | **Costs extra** — you must subscribe to exchange data packages (NYSE, NASDAQ, Nordic, etc.) for live quotes; otherwise you get delayed. This is the hidden cost. |
| Python | `ib_insync` (community, excellent), or the official `ibapi` |
| Catch | Either you keep TWS / IB Gateway running (annoying for a 24/7 dashboard) or you use the Web API which has its own session lifecycle. Real-time exchange data is paywalled. **Delayed-15-min quotes are free** — which is exactly what you said you'd accept. |

### 2.4 Saxo Bank OpenAPI — Great for the sandbox

| Item | Value |
|---|---|
| Cost | **Simulation environment is free** with a $100k paper account ([developer.saxo/openapi/learn](https://www.developer.saxo/openapi/learn)) |
| Live | Requires a funded Saxo account; live tokens differ from sim |
| Catch | Sim tokens last 24 hours, which is painful for a long-running dashboard. Useful for learning; live access tied to having Saxo as your broker. |

### 2.5 Alpaca — Mostly US-focused; verify Sweden eligibility before relying on it

- **API is free**; market data has a generous free tier (7+ years of US history, 100% US market coverage, REST with 15-min delay or websocket real-time limited to 30 symbols — [alpaca.markets/data](https://alpaca.markets/data)).
- Free **paper trading** is available globally without funding.
- **Live trading account from Sweden: unverified.** Alpaca's [countries page](https://alpaca.markets/support/countries-alpaca-is-available) explicitly tells non-US residents to email `support@alpaca.markets` — no public allow-list. The fintech press confirms an [Alpaca Europe entity launched in 2026 via the WealthKernel acquisition](https://fintech.global/2026/04/21/alpaca-expands-into-europe-with-wealthkernel-deal/), beginning with Germany's Xetra; broader EU rollout (including Sweden) was announced but not individually itemized.
- **Catch**: if all you want is a free *data* API and don't need order routing, Alpaca's free market data tier is actually one of the best in the field — 200 req/min, 7+ years history — and **paper trading is free worldwide**, so eligibility for a live Swedish account doesn't even block you. The catch is that the data is US-only.

### 2.6 Trading 212 — Watch this one

- Official API is **in beta** ([t212public-api-docs.redoc.ly](https://t212public-api-docs.redoc.ly/)).
- Demo (paper) and live environments; live limited to market orders today.
- Free with an account, Sweden supported as a customer market.
- **Catch**: beta status — endpoints can change.

### 2.7 Lemon.markets — B2B only

- Still operating; acquired by Dwpbank in August 2025 ([fintechfutures coverage](https://www.fintechfutures.com/m-a/dwpbank-acquires-lemon-markets)).
- **Brokerage API is invite-only / B2B** — not available to individual retail developers. Listed here only because older blog posts still recommend it.

### 2.8 DEGIRO / eToro

- No official public APIs for individual users as of this writing (unverified for the very latest; treat as "no" until they announce otherwise).

---

## Section 3 — Hidden costs to watch for

| Hidden cost | Affects | Mitigation |
|---|---|---|
| **Exchange data fees** | IBKR live quotes, any vendor offering "real-time SIP" | Use the 15-min delayed feed (free everywhere) — you said this is fine |
| **Non-commercial-use clauses** | Finnhub free, Tiingo free, Alpaca free data | Don't put a free-tier dashboard behind a public sign-up; personal use only |
| **Paper-tier WebSocket trial credits** | Twelve Data | Treat WebSocket as a paid feature; poll REST instead |
| **Alpha Vantage's history of cuts** | Anything you build on it today | Assume the 25/day cap could shrink again. Don't depend on it. |
| **yfinance breakage risk** | Anything that calls Yahoo via the scraper | Cache aggressively, treat as best-effort, plan a fallback |
| **Alpaca live account from Sweden** | Anyone hoping to place real orders | **Unverified** — must contact support before assuming you can fund live |
| **Saxo 24h token expiry on sim** | Saxo sandbox | Renew the token in your data loop or only use it for short sessions |

---

## Section 4 — Recommendation for your specific case

Personal portfolio dashboard, Sweden, Python, delayed data acceptable, $0 budget:

### Pragmatic stack (what I'd build today)

```
Holdings layer:
  - If you use Nordnet:     Nordnet External API (official, free)
  - If you use Avanza:      Qluxzz/avanza wrapper (unofficial, ToS risk)
  - If you use IBKR:        ib_insync + IBKR Web API (official, free, delayed quotes)
  - If you don't have a Swedish broker yet, but want one with a clean API:
                            Nordnet — only Swedish-licensed broker with a
                            first-party API explicitly aimed at retail developers.

Market data layer:
  Primary:   Finnhub free tier   (60 req/min, fundamentals, near-real-time)
  Long history:  Tiingo free tier   (30+ yrs EOD US, for charts & lifetime P&L)
  Fallback:  yfinance           (only when the above are down — cache results)
  Optional:  Alpaca free data   (if you're already opening an Alpaca paper
                                  account, their US data is excellent and free)
```

### What I would NOT recommend, and why

- **Alpha Vantage as primary**: the 25-calls-per-day ceiling makes it unfit. Use only if you specifically need an endpoint nobody else offers (some macro/forex indicators) and can cache aggressively.
- **Polygon / Marketstack / EODHD free tiers**: free quotas too small to power even a single-user dashboard.
- **A "pure-real-time, no-funded-account, free, EU-accessible" stack**: doesn't exist. Every vendor with real-time SIP requires either a paid plan or a funded brokerage account. You sidestep this entirely by accepting the 15-min delay, which you have.

### One honest caveat

If your dashboard is *exclusively* tracking Swedish stocks (OMX, First North), the free-tier US-focused APIs above (Finnhub, Tiingo, Alpaca) will not help you much — they're US-equity-centric. For Swedish-market quotes specifically, the realistic free options shrink to **Stooq CSVs** (EOD, plenty of OMX coverage) plus **Nordnet's API for your own positions and quotes** (if you're a Nordnet customer). Twelve Data's free tier covers some European equities but coverage is uneven — **unverified for OMX completeness**.

---

## Sources

1. [Alpha Vantage Premium](https://www.alphavantage.co/premium/) — current free tier limits
2. [Alpha Vantage API Request Limits — Macroption](https://www.macroption.com/alpha-vantage-api-limits/) — confirmation of 25/day, 5/min
3. [Alpha Vantage Review (Find My Moat, 2026)](https://www.findmymoat.com/tools/alpha-vantage) — historical degradation 500 → 100 → 25
4. [Finnhub API Rate Limits](https://finnhub.io/docs/api/rate-limit) — 60 calls/min on free
5. [Finnhub Pricing](https://finnhub.io/pricing-stock-api-market-data) — plan structure
6. ["7 Best Real-Time Stock Data APIs" (Coinmonks, 2026)](https://medium.com/coinmonks/the-7-best-real-time-stock-data-apis-for-investors-and-developers-in-2026-in-depth-analysis-61614dc9bf6c) — Finnhub delay & restriction notes
7. [Twelve Data Pricing](https://twelvedata.com/pricing) — 800/day, 8/min free tier
8. [Polygon.io](https://polygon.io/) — free tier 5/min
9. [Financial Modeling Prep Pricing Plans](https://site.financialmodelingprep.com/pricing-plans) — 250/day, 500MB bandwidth
10. [Tiingo Pricing](https://www.tiingo.com/about/pricing) — 50 symbols/hour, personal-use restriction
11. [Tiingo Review (Find My Moat, 2026)](https://www.findmymoat.com/tools/tiingo) — 30+ years history confirmation
12. [Tiingo IEX product page](https://www.tiingo.com/products/iex-api) — IEX real-time partnership
13. [EODHD Pricing](https://eodhd.com/pricing) — 20 calls/day free
14. [Marketstack Pricing](https://marketstack.com/pricing) — 100 requests/month
15. [Stooq Historical Database](https://stooq.com/db/h/) — CSV downloads only
16. [yfinance GitHub issue #2289 — YFRateLimitError](https://github.com/ranaroussi/yfinance/issues/2289)
17. [yfinance GitHub issue #2411](https://github.com/ranaroussi/yfinance/issues/2411)
18. [yfinance GitHub issue #2422](https://github.com/ranaroussi/yfinance/issues/2422)
19. [yfinance discussion #2431 — "is this temporary?"](https://github.com/ranaroussi/yfinance/discussions/2431)
20. ["Why yfinance Keeps Getting Blocked" (Trading Dude, Medium)](https://medium.com/@trading.dude/why-yfinance-keeps-getting-blocked-and-what-to-use-instead-92d84bb2cc01)
21. [IEX Cloud official closure notice](https://iexcloud.org/)
22. [Alpha Vantage's IEX Cloud migration guide](https://www.alphavantage.co/iexcloud_shutdown_analysis_and_migration/) — confirms 2024-08-31 shutdown
23. [Alpaca — Countries Available](https://alpaca.markets/support/countries-alpaca-is-available)
24. [Alpaca Market Data](https://alpaca.markets/data) — free vs Algo Trader Plus
25. [Alpaca Europe launch (FinTech Global, Apr 2026)](https://fintech.global/2026/04/21/alpaca-expands-into-europe-with-wealthkernel-deal/)
26. [Interactive Brokers API page](https://www.interactivebrokers.com/en/trading/ib-api.php)
27. [Interactive Brokers Fees (BrokerChooser, 2026)](https://brokerchooser.com/broker-reviews/interactive-brokers-review/interactive-brokers-fees) — $0 minimum, no inactivity fee
28. [Saxo Bank Developer Portal](https://www.developer.saxo/openapi/learn) — sim env, $100k paper account
29. [Trading 212 Public API Docs](https://t212public-api-docs.redoc.ly/) — beta status
30. [Trading 212 API key instructions](https://helpcentre.trading212.com/hc/en-us/articles/14584770928157-How-can-I-generate-an-API-key)
31. [Avanza — Qluxzz/avanza GitHub](https://github.com/Qluxzz/avanza)
32. [avanza-api on PyPI](https://pypi.org/project/avanza-api/)
33. [Nordnet next-api-v2-examples (GitHub)](https://github.com/nordnet/next-api-v2-examples) — Swedish-customers-only production access
34. [Lemon.markets acquisition by Dwpbank (FinTech Futures, 2025)](https://www.fintechfutures.com/m-a/dwpbank-acquires-lemon-markets)

---

## Methodology notes

- Every rate-limit / free-tier figure was checked against the provider's own pricing page where possible. Where the provider's page returned light snippets (Finnhub pricing, Tiingo pricing) the figure was cross-referenced against an independent 2026 review article and the agreement noted.
- "Unverified" is used wherever I could not get a 2026 primary source on a specific claim — including Alpaca live-account availability for Sweden, Twelve Data's European-equity coverage depth, and DEGIRO/eToro API status.
- I did **not** include providers whose free tiers I could not confirm were operational in 2026 (e.g., quandl/nasdaq data link's free options, Intrinio).
- Anything claiming a *truly* free real-time SIP US equity feed with no funded account requirement is, in 2026, either misrepresenting itself or quietly throttling. The honest answer is: that combination does not exist in this market.
