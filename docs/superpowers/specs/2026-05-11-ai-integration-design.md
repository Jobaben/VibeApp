# AI Integration Design — Deep Analysis Endpoint

**Date**: 2026-05-11
**Branch**: `feature/ai-integration`
**Status**: Approved for implementation planning
**Brief**: `bmad/00-brief/brief-ai-integration.md`

## Goal

Replace the `/api/ai/stock/{ticker}/deep-analysis` stub with a real LLM-backed implementation that produces structured insights (strengths, weaknesses, catalyst watch) for a single stock, surfaced in a collapsible panel on the React `StockDetail` page.

This is the MVP slice of the AI integration phase. The other four `/api/ai/*` endpoints stay as-is for this iteration; the integration pattern proved here will inform a later phase that decides whether to extend them.

## Out of Scope

- `/api/ai/analyze-stocks`, `/api/ai/compare-stocks`, `/api/ai/strategies/{name}`, `/api/ai/run-custom-screener` — unchanged in this story.
- `DeepAnalysisResponse.historical_trends` and `DeepAnalysisResponse.peer_comparison` — returned empty/null. They are not LLM work and inflate the story.
- Streaming responses. Output is short (~150 tokens of structured JSON); sync with a spinner is sufficient.
- Quality evaluation of LLM output. We test contract, not semantics.
- Metrics dashboards. Structured logs are the observability surface for this story.

## Decisions

| # | Decision | Why |
|---|---|---|
| 1 | LLM applies only to `deep-analysis` | Smallest slice that proves end-to-end pattern (auth, prompt, caching, UI wiring). |
| 2 | Provider: Anthropic Claude, model `claude-sonnet-4-6` | Reliable structured JSON output; native prompt caching cuts repeat cost; existing team familiarity. |
| 3 | UI: opt-in collapsible panel on `StockDetail` | Explicit cost control; no LLM call on page view; reuses existing page. |
| 4 | Result cache in Redis, 24h TTL, key `ai:insight:{ticker}:{score_hash}` | Fundamentals move slowly; caches the dominant traffic pattern; self-invalidates on content change via the hash. |
| 5 | Disclaimer rendered in the frontend, not in LLM output | Immutable, saves tokens, no risk of model omitting it. |
| 6 | Sync request | Output too small to justify streaming complexity. |
| 7 | No silent fallback on LLM failure | A surfaced error is better than fabricated content. |
| 8 | Rate limit: 5 req/min per IP on this route | Cheap insurance against accidental loops; cache absorbs legitimate repeat traffic. |

## Architecture

```
React StockDetail
   └─ user clicks "Show AI analysis"
       └─ GET /api/ai/stock/{ticker}/deep-analysis
            └─ FastAPI router (rate-limited 5/min/IP)
                 └─ InsightService.get_stock_with_insight(ticker)
                      ├─ Fetch stock + scores via existing stock_repo
                      ├─ Compute score_hash (stable digest of scores + fundamentals subset)
                      ├─ Redis lookup: ai:insight:{ticker}:{score_hash}
                      │    └─ HIT → return cached AIInsight
                      ├─ MISS → AnthropicClient.generate_insight(payload)
                      │    ├─ System + schema prompts marked cache_control=ephemeral
                      │    ├─ Per-ticker user message (not cached)
                      │    └─ Validate & parse → AIInsight
                      ├─ Store in Redis with 24h TTL
                      └─ Return populated StockAnalysis (with ai_insights)
```

## New / Touched Files

| File | Change |
|---|---|
| `backend/app/llm/__init__.py` | New package marker. |
| `backend/app/llm/anthropic_client.py` | New. SDK wrapper, prompt-cache control, retries. |
| `backend/app/llm/insight_service.py` | New. Orchestrates fetch → hash → cache lookup → LLM → cache store. |
| `backend/app/llm/prompts.py` | New. `SYSTEM_PROMPT`, `SCHEMA_INSTRUCTION`, `build_user_message`. |
| `backend/app/llm/errors.py` | New. `InsightGenerationError`, `InsightSchemaError`. Stock-not-found reuses existing `app.shared.exceptions.NotFoundException`. |
| `backend/app/features/ai/router.py` | Replace stub in `deep_analysis` with `InsightService` call; add slowapi limit. |
| `backend/app/config.py` | Add `ANTHROPIC_API_KEY`, `LLM_MODEL`, `LLM_ENABLED`, `LLM_INSIGHT_TTL_SECONDS`, `LLM_INSIGHT_RATE_LIMIT_PER_MIN`. |
| `backend/app/infrastructure/cache/redis_cache.py` | No change. Existing `CacheService.invalidate(pattern)` is already SCAN-based. |
| `backend/app/tasks/score_tasks.py` | Add post-recompute hook in `recalculate_all_scores`: `cache_service.invalidate("ai:insight:*")` after successful pass. |
| `backend/requirements.txt` | Add `anthropic>=0.40.0`, `slowapi>=0.1.9` (if not present). |
| `backend/.env.example` | Add `ANTHROPIC_API_KEY=`, `LLM_ENABLED=true`, `LLM_MODEL=claude-sonnet-4-6`. |
| `frontend/src/components/AIAnalysisPanel.tsx` | New. Collapsed/loading/loaded/error/disabled states. |
| `frontend/src/services/api.ts` | Add `aiApi.getDeepAnalysis(ticker)`. |
| `frontend/src/types/stock.ts` | Add `AIInsight`, `DeepAnalysisResponse` types. |
| `frontend/src/pages/StockDetail.tsx` | Mount `<AIAnalysisPanel ticker={ticker} />` below `ScoreBreakdown`. |
| `backend/tests/unit/test_prompts.py` | New. |
| `backend/tests/unit/test_insight_service.py` | New. |
| `backend/tests/unit/test_anthropic_client.py` | New. |
| `backend/tests/integration/test_ai_endpoints.py` | Extend with deep-analysis cases. |
| `frontend/src/components/AIAnalysisPanel.test.tsx` | New. |
| `backend/tests/smoke/test_live_anthropic.py` | New. Skipped unless `RUN_LIVE_LLM=1`. |

## Backend Components

### `anthropic_client.py`

```python
class AnthropicClient:
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        ...

    def generate_insight(self, stock_payload: dict) -> AIInsight:
        # 1. Build messages with cache_control breakpoints:
        #    - system prompt block: ephemeral cache
        #    - schema instruction block: ephemeral cache
        #    - per-ticker user message: not cached
        # 2. messages.create(max_tokens=600, temperature=0.3)
        # 3. Retry 3x with exponential backoff (1s, 2s, 4s) on network / 5xx
        # 4. Parse JSON strictly; validate against AIInsight pydantic model
        # 5. Enforce per-item word cap (<=20 words) inside the client
        # 6. Raise InsightGenerationError on all-retries-failed network errors
        # 7. Raise InsightSchemaError on JSON parse failure or schema violation
```

### `prompts.py`

- `SYSTEM_PROMPT` — neutral financial analyst persona, Swedish stock context, explicitly forbids buy/sell recommendations and certainty claims.
- `SCHEMA_INSTRUCTION` — exact JSON shape: `{"strengths": [...], "weaknesses": [...], "catalyst_watch": [...]}`, 2–4 items per list, each item ≤ 20 words, plain text (no markdown).
- `build_user_message(stock_payload: dict) -> str` — interpolates ticker, sector, key fundamentals, scores, and sector context into a compact narrative input.

### `insight_service.py`

```python
class InsightService:
    def __init__(self, anthropic_client, cache_service, stock_repo, config):
        ...

    def get_stock_with_insight(self, ticker: str) -> StockAnalysis:
        stock = self._stock_repo.get_full_analysis(ticker)  # raises NotFoundException

        if not self._config.LLM_ENABLED:
            stock.ai_insights = AIInsight(strengths=[], weaknesses=[], catalyst_watch=[])
            return stock

        score_hash = self._score_hash(stock.scores, stock.fundamentals)
        key = f"ai:insight:{ticker}:{score_hash}"

        cached = self._cache.get(key)
        if cached:
            stock.ai_insights = AIInsight.model_validate_json(cached)
            return stock

        payload = self._build_payload(stock)
        insight = self._anthropic.generate_insight(payload)
        self._cache.set(key, insight.model_dump_json(), ttl=self._config.LLM_INSIGHT_TTL_SECONDS)
        stock.ai_insights = insight
        return stock

    @staticmethod
    def _score_hash(scores, fundamentals) -> str:
        # canonical JSON of scores + selected fundamentals subset
        # (pe_ratio, roic, roe, debt_equity, fcf_yield, sector, signal)
        # sha256, first 16 hex chars
        ...
```

### Router

```python
@router.get("/stock/{ticker}/deep-analysis", response_model=DeepAnalysisResponse)
@limiter.limit("5/minute")
async def deep_analysis(
    request: Request,
    response: Response,
    ticker: str,
    service: InsightService = Depends(get_insight_service),
    config: Settings = Depends(get_settings),
):
    try:
        stock = service.get_stock_with_insight(ticker)
    except NotFoundException:
        raise HTTPException(404, f"Stock {ticker} not found")
    except InsightGenerationError:
        raise HTTPException(503, detail={"detail": "AI analysis temporarily unavailable", "code": "llm_unavailable"})
    except InsightSchemaError as e:
        logger.error("LLM schema error", ticker=ticker, raw=str(e)[:1024])
        raise HTTPException(502, detail={"detail": "AI analysis failed validation", "code": "llm_schema_error"})

    if not config.LLM_ENABLED:
        response.headers["X-AI-Status"] = "disabled"

    return DeepAnalysisResponse(
        stock=stock,
        historical_trends={},
        peer_comparison=None,
    )
```

### Config additions

```python
ANTHROPIC_API_KEY: str = ""
LLM_MODEL: str = "claude-sonnet-4-6"
LLM_ENABLED: bool = True
LLM_INSIGHT_TTL_SECONDS: int = 86_400
LLM_INSIGHT_RATE_LIMIT_PER_MIN: int = 5
```

When `LLM_ENABLED=True` but `ANTHROPIC_API_KEY` is empty, the app fails fast on startup with a clear error.

## Frontend Component

### `AIAnalysisPanel.tsx`

Props: `{ ticker: string }`.

States: `collapsed` (default) | `loading` | `loaded` | `error` | `disabled`.

- Collapsed: header `🧠 AI Analysis` + button `Show analysis`. Zero traffic.
- Loading: spinner + "Generating analysis…" + subtext "First fetch can take ~3–5s. Cached results are instant."
- Loaded: three labeled lists — **Strengths** (green accent), **Weaknesses** (amber accent), **Watch for** (blue accent) — followed by a fixed disclaimer block.
- Error: error icon + "AI analysis temporarily unavailable" + a subtext from the error `code` (`rate_limited`, `llm_unavailable`, `llm_schema_error`) + retry button (disabled while 429 `Retry-After` is in effect).
- Disabled: info block "AI analysis is disabled in this environment." Distinct from error styling. Driven by `X-AI-Status: disabled` header on a 200 response.

In-component memoization: once `loaded`, collapsing and re-expanding does not re-fetch.

### Disclaimer text (static, frontend-owned)

> AI-generated analysis based on current fundamentals. Not investment advice. Always do your own research.

### `services/api.ts` addition

```ts
export const aiApi = {
  getDeepAnalysis: (ticker: string) =>
    apiClient.get<DeepAnalysisResponse>(`/api/ai/stock/${ticker}/deep-analysis`),
};
```

### Mount point in `StockDetail.tsx`

Single new line below `ScoreBreakdown`:

```tsx
<AIAnalysisPanel ticker={ticker} />
```

## Caching & Invalidation

### Cache key

```
ai:insight:{ticker}:{score_hash}
```

`score_hash` = first 16 hex chars of `sha256(canonical_json({"scores": scores, "fundamentals": fundamentals_subset}))`.

Fundamentals subset: `pe_ratio`, `roic`, `roe`, `debt_equity`, `fcf_yield`, `sector`, `signal`. Price and intraday metrics are explicitly excluded — they change constantly and would defeat the cache.

### Stored value

```json
{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "catalyst_watch": ["..."],
  "generated_at": "2026-05-11T08:23:11Z",
  "model": "claude-sonnet-4-6",
  "score_hash": "a1b2c3d4..."
}
```

`generated_at` and `model` aid debugging and bulk purge when prompts/model change. Only `strengths`, `weaknesses`, `catalyst_watch` are returned to the frontend.

### TTL

24h hard ceiling. Refresh-on-content-change is the primary invalidation; TTL is the safety net.

### Explicit invalidation on score recompute

`CacheService.invalidate(pattern)` is already SCAN-based and present in `app/infrastructure/cache/redis_cache.py`. After `recalculate_all_scores` (Celery task in `app/tasks/score_tasks.py`) finishes a successful pass:

```python
cache_service.invalidate("ai:insight:*")
```

Bulk pattern is acceptable here because (a) the recompute task itself is bulk, (b) it runs off the user request path, and (c) the content-hashed cache key is the primary invalidation — this is the safety-net pass that prevents orphaned entries from accumulating.

### Anthropic prompt cache

`cache_control: {"type": "ephemeral"}` on system + schema blocks. User message per ticker is not cached. Yields a ~5–10x cost reduction on Anthropic-side cache hits within the 5-minute window.

### Rate limit

`slowapi` limiter, 5/min per IP, applied only to the `deep-analysis` route. 429 returns a `Retry-After` header.

### Disabled mode (`LLM_ENABLED=False`)

Skips both caches entirely. Service returns sentinel `AIInsight` with empty lists. Response carries `X-AI-Status: disabled`. Tests do not require a real API key.

## Error Handling

| Class | Trigger | Status | Code | Frontend behavior |
|---|---|---|---|---|
| Unknown ticker | `NotFoundException` | 404 | — | Error state with "Stock not found" |
| LLM unavailable | All retries failed (network/5xx) | 503 | `llm_unavailable` | Error state, retry button enabled |
| LLM schema failure | Malformed JSON or violates `AIInsight` schema | 502 | `llm_schema_error` | Error state, retry button enabled |
| Rate limited | slowapi limiter triggered | 429 | `rate_limited` | Error state, retry disabled until `Retry-After` |
| Disabled | `LLM_ENABLED=False` | 200 + `X-AI-Status: disabled` | — | Info state ("AI disabled in this environment") |

### Explicit non-behaviors

- No automatic frontend retries on 503 — stampedes during incidents.
- No fallback to a different model on failure.
- No serving stale entries beyond TTL or across `score_hash` boundaries.
- No fabricated placeholder insights on error.

### Logging

One structured INFO line per request:

```
event=ai.deep_analysis ticker=VOLV-B cache_hit=false latency_ms=2340 model=claude-sonnet-4-6 score_hash=a1b2c3d4 status=ok
```

Status values: `ok`, `llm_unavailable`, `llm_schema_error`, `rate_limited`, `not_found`, `disabled`.

## Testing

### Backend unit tests

- `test_prompts.py` — deterministic, no `None` leaks, length under 2KB, ticker/sector/metrics present.
- `test_insight_service.py` — cache HIT skips LLM; cache MISS calls LLM and stores; unknown ticker raises `NotFoundException`; score_hash stable across price changes; differs across score changes; `LLM_ENABLED=False` returns sentinel without calling LLM.
- `test_anthropic_client.py` — request payload carries `cache_control` on system + schema blocks; valid JSON parses; malformed JSON raises `InsightSchemaError`; >20-word items raise; 3 retries then `InsightGenerationError`.

### Backend integration tests

`backend/tests/integration/test_ai_endpoints.py` extended (real FastAPI client, real Redis, Anthropic client patched):

- Happy path: 200 with populated `ai_insights`.
- Second call within TTL: zero LLM calls.
- After `cache_service.invalidate("ai:insight:*")`: LLM re-invoked on next request.
- Unknown ticker → 404.
- LLM fake raises → 503 with `code: llm_unavailable`.
- LLM fake returns malformed JSON → 502 with `code: llm_schema_error`.
- 6th request in 60s → 429 with `Retry-After`.
- `LLM_ENABLED=False`: 200 + `X-AI-Status: disabled` + sentinel insight.

### Frontend tests

`AIAnalysisPanel.test.tsx` — matches existing component test style (Vitest + React Testing Library):

- Initial render collapsed, no fetch fired.
- Click expand: one fetch, loading then loaded with three lists.
- Collapse + re-expand: no second fetch.
- 503 → error state, retry enabled.
- 429 → error state, retry disabled.
- `X-AI-Status: disabled` → info state, no error styling.
- Disclaimer text rendered in loaded state.

### Manual smoke test (gated)

`backend/tests/smoke/test_live_anthropic.py` — `@pytest.mark.skipif(not os.getenv("RUN_LIVE_LLM"))`. Hits real Anthropic API with one ticker. Run locally when changing prompts or upgrading the model. Never in CI.

## Acceptance Criteria

1. `GET /api/ai/stock/{ticker}/deep-analysis` returns a `DeepAnalysisResponse` with a non-empty `ai_insights` containing real, contextual content for a known ticker.
2. Second request for the same ticker within 24h does not invoke the LLM (verified via logs / test mock).
3. Score recompute for a ticker invalidates that ticker's insight cache.
4. `StockDetail` page renders a collapsed `AIAnalysisPanel`; expanding it shows real insights and a disclaimer.
5. Unknown ticker → 404; LLM failure → 503 with `code: llm_unavailable`; schema failure → 502 with `code: llm_schema_error`; 6+ requests/min/IP → 429.
6. With `LLM_ENABLED=False`, endpoint returns 200 + sentinel + `X-AI-Status: disabled`; frontend renders the info state; no API key is required.
7. All new unit and integration tests pass in CI without a live Anthropic key.
8. `.env.example` documents `ANTHROPIC_API_KEY`, `LLM_ENABLED`, `LLM_MODEL`. No real key is committed.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Prompt drift produces inconsistent output shape | Strict JSON validation in `AnthropicClient` + `test_anthropic_client.py` cases; raise rather than swallow. |
| Anthropic outage during incidents | Surface 503 with retry; do not serve stale or fabricated content. |
| Unexpected API cost spike | Per-IP rate limit + 24h content-hashed cache + Anthropic prompt cache; structured log line includes `cache_hit` for daily review. |
| Cache invalidation drift (cache keeps stale entries when scores change) | Content-hashed key (self-invalidates) + bulk `invalidate("ai:insight:*")` hook in `recalculate_all_scores` Celery task. Two independent paths. |
| `invalidate` SCAN cost on large keyspace | Pattern restricted to `ai:insight:*` (narrow namespace); runs in Celery context, not user request path. |
| User runs against `LLM_ENABLED=False` and thinks it's broken | `X-AI-Status: disabled` header drives a distinct frontend info state, not an error. |

## Open Questions Resolved During Brainstorm

- Provider → Claude.
- Scope → `deep-analysis` only.
- UI placement → opt-in panel on `StockDetail`.
- Cache strategy → 24h TTL, content-hash key, explicit invalidation on score recompute.
- Sync vs streaming → sync.
- Disclaimer placement → frontend, immutable.
- Error fallback policy → surface failures, no fabrication.

## Next Step

Invoke `writing-plans` skill to produce a step-by-step implementation plan from this spec.
