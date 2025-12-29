# Brief: AI Integration Phase

**Date**: 2025-12-30
**Role**: Analyst
**Status**: Complete

## Problem Statement

VibeApp has a comprehensive stock analysis platform with scoring, screening, and technical analysis features. However, the **AI-powered insights** advertised in the app description are currently stub implementations. Users expect intelligent analysis but receive placeholder responses.

The backend has an AI router (`/api/ai/*`) with 5 endpoints that return empty data or "not implemented" errors:
- `/api/ai/analyze-stocks` - Placeholder response
- `/api/ai/stock/{ticker}/deep-analysis` - Returns 404
- `/api/ai/compare-stocks` - Empty results
- `/api/ai/strategies/{strategy_name}` - Empty
- `/api/ai/run-custom-screener` - Empty

---

## Who is Affected

### Primary Stakeholders

| Stakeholder | Impact |
|-------------|--------|
| End Users | Expect AI insights but get placeholder data |
| Developers | AI client code exists but calls non-functional endpoints |
| Product Team | Feature is advertised but not delivered |

### User Personas

1. **Retail Investor (Alex)**
   - Wants AI-generated analysis to understand stock fundamentals
   - Expects natural language explanations of why a stock scores well/poorly
   - Needs help interpreting complex financial data

2. **Learning User (Sam)**
   - Uses Learning Mode to understand investing
   - Would benefit from AI explanations in plain English
   - Wants to know "why" not just "what"

---

## Current State

### What Exists
- AI router with 5 endpoint stubs
- AI client module (`backend/app/ai_client/client.py`)
- Comprehensive stock data (fundamentals, scores, technicals)
- Well-structured backend ready for AI integration

### What's Missing
- Actual AI/LLM integration
- Natural language analysis generation
- Intelligent stock comparison
- AI-powered screening recommendations

---

## Impact of the Problem

1. **User Disappointment**: App promises AI analysis but doesn't deliver
2. **Incomplete Feature**: Significant development effort (endpoints, client) with no value
3. **Competitive Gap**: Modern fintech apps offer AI insights as standard
4. **Learning Mode Gap**: Educational feature could be enhanced with AI explanations

---

## Success Criteria

1. At least one AI endpoint returns meaningful, generated content
2. Stock analysis includes natural language explanations
3. Users can get AI-powered insights on any stock
4. AI responses are contextually relevant to the stock's data

---

## Constraints

1. **No API Keys Committed**: Any AI API keys must use environment variables
2. **Cost Awareness**: AI API calls have costs; consider caching or rate limiting
3. **Response Time**: AI calls may be slow; consider async patterns
4. **Accuracy Disclaimers**: AI insights must include appropriate disclaimers

---

## Scope Options

### Option A: Minimal - Single Endpoint (Recommended for MVP)
- Implement `/api/ai/stock/{ticker}/deep-analysis` only
- Generate AI analysis for individual stocks using existing score data
- Use Claude or OpenAI API for text generation

### Option B: Medium - Analysis + Comparison
- Implement deep-analysis AND compare-stocks endpoints
- Enable side-by-side AI comparisons

### Option C: Full - All AI Endpoints
- Implement all 5 AI endpoints
- AI-powered custom screener
- Strategy explanations

---

## Questions for PM

1. **Which AI provider**: Claude API, OpenAI, or local model?
2. **Scope preference**: Option A (minimal), B (medium), or C (full)?
3. **Cost model**: Per-request API calls or cached responses?
4. **Frontend integration**: Add AI insights to existing Stock Detail page or new page?

---

## Recommendations

Based on analysis, recommend starting with **Option A** (single endpoint):
- Lowest risk, fastest delivery
- Proves the integration pattern
- Can expand to other endpoints iteratively
- Provides immediate user value

---

## Next Step

`/pm` to define requirements for AI integration phase.
