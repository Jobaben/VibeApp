# Learning Lab Beginner UX Redesign

**Date:** 2026-04-26
**Status:** Approved direction (from brainstorming session 2026-04-26), ready for implementation planning
**Scope:** Reframe the existing `LearningLab` page into a guided beginner flow without changing the underlying simulator logic, types, or trade execution.

## Product Decision

Keep the current Learning Lab simulator and all of its underlying mechanics (paper portfolio, plan capture, position sizing helper, sell review, dashboard, journal) — but reorganize the page so a first-time user is taught what the lab wants from them through a guided narrative instead of a trading-console layout.

The previous design (`2026-04-25-learning-lab-investor-training-loop-design.md`) successfully introduced disciplined investing concepts (thesis, invalidation, review condition, risk per trade, position sizing). It is also dense: a beginner sees an "Execution Console", a multi-field plan card, and a sell-review form — all at once, with terms like P/L, plan-following rate, and Learning Missions visible before any action has been taken. This redesign sequences the same content for a beginner and softens the language.

## Learning Principle (unchanged)

The lab teaches terms through action. A beginner should not need to know "invalidation point", "position sizing", or "P/L" before understanding what the app wants them to do. Plain-language prompt first, term second, short explanation third.

## UX Direction

### 1. Reframe the page

- Page title becomes **"Practice investing without real money"**.
- Subtitle reinforces: the lab uses live data, but no real money is at risk; mistakes here are how you learn.
- Existing disclaimers and "not financial advice" copy stay.

### 2. Beginner landing panel

A small, dismissible-but-persistent panel at the top introduces three steps before any UI controls:

1. **Pick a company** — choose something from the leaderboard you'd like to learn about.
2. **Make a simple plan** — answer four short questions in plain language.
3. **Review what happened** — when you sell, write down what you learned.

This panel orients the user before they encounter the form fields.

### 3. Guided practice trade flow (replaces "Execution Console")

Replace the "Execution Console" heading and the dense plan card with a single section titled **"Guided practice trade"** that displays the same fields, but as numbered steps with prominent step headers and an inline progress hint:

1. **Choose a company to practice with.** (ticker selector + share count)
2. **Explain why it might become more valuable.** (`reasonForBuying`)
3. **Decide what would prove the idea wrong.** (`wrongSignal`, `plannedWrongPrice`)
4. **Choose a small practice risk.** (`maxPracticeLoss`, `maxPracticeLossType`)
5. **Choose when to check back.** (`reviewCondition`)
6. **Place the paper trade.** (Buy button, position-size summary, oversized warning)

Step layout is single-page (not a multi-step wizard) so users can see the whole picture, but each step is visually numbered and spaced. The professional term ("investment thesis", "invalidation point", "review condition", "risk per trade", "position sizing") appears as secondary text under each plain-language prompt.

### 4. Defer the sell-review form

Currently the sell-review form is always visible alongside the buy plan. This is confusing for a beginner who has no open positions yet. Instead:

- Sell review form is **hidden by default**.
- Each open position card gets a **"Review and sell"** button.
- Clicking it reveals the review form scoped to that position (panel slides in or appears under the position card).
- Sell submits from this panel; the panel closes after submit or cancel.
- A new local UI state, `reviewingPositionTicker: string | null`, drives this.

The selected ticker for *buying* is unchanged — it remains independent from the position-being-reviewed state. The Sell button leaves the buy area entirely.

### 5. Reframe open positions

- Section title: **"Positions you are practicing with"**.
- Each card keeps existing data (shares, avg cost, current price, unrealized P/L, plan summary, planned-risk status).
- Add a **next action hint** at the bottom of each card derived from existing data:
  - If `currentPrice < plannedWrongPrice`: *"Price is below your wrong-price. Time to review."*
  - Else if review condition exists and contains a date that has passed: leave the existing message; cheap heuristic only.
  - Otherwise: *"Keep watching. Review when your plan says to."*
- Add **"Review and sell"** button per card (sets `reviewingPositionTicker`).

No changes to the underlying `Position` or `TradePlan` types.

### 6. Reframe dashboard metrics

The Learning Dashboard card keeps its values; only labels change to plain language:

| Old label                  | New label                          |
|----------------------------|------------------------------------|
| Completed plans            | Practice plans made                |
| Closed reviews             | Trades reviewed                    |
| Plan Following (top tile)  | Times you followed your plan       |
| Average win                | Average win when you were right    |
| Average loss               | Average loss when you were wrong   |
| Common mistake             | Mistake to watch for               |

The disclaimer line ("This is practice feedback, not financial advice…") is preserved.

### 7. Rename "Learning Missions" to "Your practice checklist"

Beginner-path items, in order:

1. Pick one company you'd like to learn about.
2. Write a plain-language reason for buying.
3. Write what would prove your idea wrong.
4. Choose how much you would accept losing.
5. Place one practice trade with a complete plan.
6. After at least a week, review the trade and write down one lesson.

The dashboard mission progress hooks (if any) can stay aligned with `dashboardMetrics` numbers; this redesign does not change that math.

## Architecture Decisions

### Component split

Extract the page into focused components under `frontend/src/components/learningLab/`. Page-level state and effects remain in `LearningLab.tsx`; new components are presentational and receive props/handlers.

```
frontend/src/components/learningLab/
  copy.ts                     # Plain-language strings, labels, step headings
  PracticeIntroPanel.tsx      # The three-step beginner landing
  GuidedPracticeFlow.tsx      # Numbered six-step practice trade flow
  PracticePositions.tsx       # Reframed open positions list
  PracticePositionCard.tsx    # Individual position card with next-action hint
  SellReviewPanel.tsx         # Conditional sell review form for one position
  LearningDashboardCard.tsx   # Renamed-label dashboard
  PracticeChecklist.tsx       # Renamed Learning Missions
  index.ts                    # Re-exports
```

### State additions in `LearningLab.tsx`

Only one new piece of UI state:

```ts
const [reviewingPositionTicker, setReviewingPositionTicker] = useState<string | null>(null);
```

`executeTrade('SELL')` consumes the position whose ticker matches `reviewingPositionTicker` (or falls back to `selectedTicker` if reviewing is null, to preserve the existing keyboard path). The sell-button-on-position handler sets the reviewing ticker and uses the position's share count as the default for `sharesInput` (or a separate sell shares input — see "Out of scope" below).

### Out of scope

- No changes to `frontend/src/types/learningLab.ts`.
- No changes to `frontend/src/utils/learningLab.ts` (pure trade/state helpers, position sizing, dashboard metrics).
- No changes to backend, API, or persistence.
- No changes to `frontend/src/components/learning/*` (the lesson-mode overlay/sidebar from earlier work).
- No new tests or test framework. Frontend has no test runner; verification is via `tsc`, `lint`, and a manual UI walkthrough as in the prior plan.
- No multi-step wizard or page navigation between steps. The flow stays single-page; steps are visually numbered.
- No new dashboard metric. Labels change; calculations don't.
- For the sell review panel: keep using the existing `sharesInput` field for sell quantity initially, but pre-fill it with the reviewed position's share count when the panel opens. A dedicated sell-shares input is a follow-up.

## Success Criteria

A beginner who has never used the lab can:

1. Read the page header and the three-step landing and know what the page wants from them.
2. Follow the numbered steps in order without ever needing to learn an unfamiliar term first.
3. Place one practice buy after answering all four plain-language plan prompts.
4. See their open position framed as "a position you're practicing with", with a clear next action.
5. Click "Review and sell" only when they're ready to close a position, not on first arrival.
6. See dashboard numbers labeled in language they understand.

The redesign succeeds if it lowers the perceived difficulty of the page without removing or weakening the disciplined-trading practice loop introduced in the prior slice.
