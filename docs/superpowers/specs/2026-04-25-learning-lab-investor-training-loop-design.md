# Learning Lab Investor Training Loop Design

**Date:** 2026-04-25
**Status:** Approved direction, ready for implementation planning
**Scope:** Strengthen the existing `LearningLab` page into an investor-first practice system with trading discipline.

## Product Decision

Strengthen the current Learning Lab instead of adding a new chapter first.

The app already has the right foundation: a live-data paper portfolio, buy/sell actions, trade reasons, a journal, learning missions, and portfolio P/L. The missing product layer is a guided feedback loop that teaches users how to make disciplined investing decisions. The next version should focus on practice quality, not more passive content.

The product should be investor-first with trading discipline. Users practice finding promising companies and holding positions for a reasonable review period, while still learning risk, sizing, invalidation, and post-trade review.

## Learning Principle

The lab must not assume users already know investing jargon.

Each required decision starts in plain language, then introduces the professional term after the user understands the action. For example:

- "Why might this company become more valuable?" introduces "investment thesis."
- "What would tell you your idea was wrong?" introduces "invalidation point."
- "When will you check if this is working?" introduces "review condition."
- "How much are you willing to lose if you are wrong?" introduces "risk per trade."
- "How many shares keeps that loss small?" introduces "position sizing."

This solves the hen-and-egg problem: users learn the term by performing the decision.

## Core User Loop

1. Pick a company to practice with from the leaderboard. Future implementation can add screener and watchlist entry points.
2. Explain why the company might become more valuable.
3. Define what would prove the idea wrong.
4. Define when to review the position.
5. Choose a maximum practice loss.
6. Let the app suggest a safer position size.
7. Buy only after the plan is complete.
8. Track the open position against the original plan.
9. When selling, review whether the original idea worked, failed, or is still unclear.
10. Show a dashboard with both money outcomes and process quality.

The app should reward disciplined decisions, not only profitable results. A losing trade that followed a clear plan is valid learning. A profitable trade without a plan should be flagged as weak process.

## UI Components

### Guided Trade Plan

Replace the single free-text reason field with a beginner-friendly trade plan card. The card appears before buying and uses plain-language prompts:

- `Your reason for buying`: why this company might become more valuable.
- `Your "I was wrong" signal`: the condition that would make the user reconsider.
- `Your planned check-in`: date or condition for reviewing the position.
- `Your max practice loss`: the maximum portfolio amount or percent the user is willing to risk.

Each prompt includes a short explanation and the investing term it maps to. The professional term should be secondary, not the primary label.

### Position Size Helper

Add a helper that estimates safer share count from:

- Current portfolio value.
- Selected ticker price.
- User's max practice loss.
- User's "I was wrong" price or percent threshold.

The helper should explain the calculation in plain language. If the user chooses a larger size than the helper recommends, the UI should warn but not block by default.

### Open Position Coach

Open positions should show more than P/L. Each position should display:

- Original reason for buying.
- "I was wrong" signal.
- Planned check-in.
- Current unrealized P/L.
- Whether the position is within the user's planned risk.

If the user has no plan data, the position should be marked as incomplete learning data rather than silently accepted.

### Sell Review

Selling should trigger a review step before the order is recorded. The review asks:

- Did your original idea work, fail, or is it unclear?
- Did you follow your plan?
- What did you learn?
- Optional mistake type: no clear reason, too large, ignored warning sign, sold emotionally, bought only because score was high, other.

The review should be stored with the sell trade and used for dashboard feedback.

### Learning Dashboard

Add a compact learning dashboard to the Lab. It should include:

- Portfolio value and total P/L.
- Number of completed trade plans.
- Number of closed reviews.
- Plan-following rate.
- Average win and average loss where available.
- Common mistake type.
- Current mission progress.

This dashboard should make process quality visible. It should not imply guaranteed earnings or personalized financial advice.

## Data Model

The current localStorage simulator can remain the first storage layer. Extend it instead of adding backend persistence in this slice.

Required model additions for this slice:

```ts
interface TradePlan {
  id: string;
  ticker: string;
  reasonForBuying: string;
  wrongSignal: string;
  reviewCondition: string;
  maxPracticeLoss: number;
  maxPracticeLossType: 'amount' | 'percent';
  plannedEntryPrice: number;
  plannedWrongPrice?: number;
  suggestedShares?: number;
  createdAt: string;
}

interface TradeReview {
  tradeId: string;
  outcome: 'worked' | 'failed' | 'unclear';
  followedPlan: boolean;
  lessonLearned: string;
  mistakeType?: 'no_reason' | 'too_large' | 'ignored_warning' | 'emotional_sell' | 'score_only' | 'other';
  reviewedAt: string;
}
```

`Position` should reference the active plan ID. `Trade` should optionally reference both a plan ID and review data.

## Error Handling

- If market prices cannot load, keep existing fallback behavior but label the price as estimated/demo data.
- If position sizing cannot be calculated because the user has not provided enough data, show a plain-language missing-fields message.
- If localStorage contains old simulator state, migrate gracefully by treating existing positions and trades as "unplanned practice history."
- If stored data is corrupt, reset to the default simulator state and show a short recovery message.

## Testing

Implementation should include at least these checks:

- Existing simulator state loads without plan fields.
- A buy cannot be submitted until required beginner-friendly plan fields are filled.
- Position size helper calculates expected shares for amount-based and percent-based max loss.
- Oversized trades show a warning.
- Sell review data is saved with the trade.
- Dashboard metrics handle empty history, open-only history, and closed trades.
- Corrupt localStorage falls back safely.

If the frontend still has no test runner configured, add pure helper functions for calculations and cover them when frontend test tooling is introduced. In the meantime, document manual verification steps in the implementation plan.

## Non-Goals

- No real brokerage integration.
- No real-money execution.
- No personalized financial advice.
- No AI coaching in this slice.
- No backend persistence in this slice.
- No separate new learning chapter until the lab practice loop works.

## Success Criteria

The upgraded Learning Lab succeeds if a beginner can complete a paper trade while understanding, in plain language:

- Why they bought.
- What would prove them wrong.
- How much they are risking.
- Why their position size is reasonable.
- What they learned after closing or reviewing the position.

The product should feel less like a toy portfolio tracker and more like a structured investing practice environment.
