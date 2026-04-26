# Learning Lab Beginner UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe `LearningLab.tsx` into a guided beginner flow (intro panel + numbered six-step practice trade + deferred sell review + plain-language labels) without altering simulator logic, types, or trade execution.

**Architecture:** Extract presentational components into `frontend/src/components/learningLab/` and keep page-level state in `LearningLab.tsx`. Add one new piece of state (`reviewingPositionTicker`) that gates a per-position sell-review panel. All copy moves into a single `copy.ts` module so labels are reviewable in one place.

**Tech Stack:** React 18 + TypeScript (strict), Vite, Tailwind CSS. No test runner — verification via `npm --prefix frontend run build` (`tsc && vite build`), `npm --prefix frontend run lint`, and a manual UI walkthrough script.

**Spec:** `docs/superpowers/specs/2026-04-26-learning-lab-beginner-ux-design.md`

---

## Testing Note

The frontend has no test framework configured (no vitest/jest, no `*.test.*` files). Following the precedent from `docs/superpowers/plans/2026-04-25-learning-lab-investor-training-loop.md`, this plan uses TypeScript type-checking, ESLint, and a manual UI walkthrough as verification. Adding a test runner is out of scope.

Each task therefore replaces the usual "write failing test → make it pass" loop with: **(a)** make the code change, **(b)** run `npm --prefix frontend run build` to confirm types still compile, **(c)** when the task touches the rendered UI, perform the listed manual checks against `npm --prefix frontend run dev` before committing.

## File Structure

**Create:**
- `frontend/src/components/learningLab/copy.ts`
- `frontend/src/components/learningLab/PracticeIntroPanel.tsx`
- `frontend/src/components/learningLab/GuidedPracticeFlow.tsx`
- `frontend/src/components/learningLab/PracticePositions.tsx`
- `frontend/src/components/learningLab/PracticePositionCard.tsx`
- `frontend/src/components/learningLab/SellReviewPanel.tsx`
- `frontend/src/components/learningLab/LearningDashboardCard.tsx`
- `frontend/src/components/learningLab/PracticeChecklist.tsx`
- `frontend/src/components/learningLab/index.ts`

**Modify:**
- `frontend/src/pages/LearningLab.tsx` (heavy reorganization; render switches to extracted components, add `reviewingPositionTicker` state, route SELL through the panel)

**Do not touch:**
- `frontend/src/types/learningLab.ts`
- `frontend/src/utils/learningLab.ts`
- `frontend/src/components/learning/*` (older lesson UI, unrelated)
- Any backend or API code

---

## Task 1: Create the copy module

**Why first:** Centralizing every label up front prevents drifting strings across components and makes review of the language change a one-file diff.

**Files:**
- Create: `frontend/src/components/learningLab/copy.ts`

- [ ] **Step 1: Create the copy module with all reframed strings**

```ts
// frontend/src/components/learningLab/copy.ts

export const PAGE_HEADER = {
  title: 'Practice investing without real money',
  subtitle:
    'Train with a live-data paper portfolio. The lab teaches plain-language investing decisions first, then introduces the market terms after you use them. No real money is at risk — mistakes here are how you learn.',
};

export const INTRO_STEPS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: '1. Pick a company',
    body: 'Choose something from the leaderboard you would like to learn about.',
  },
  {
    title: '2. Make a simple plan',
    body: 'Answer four short questions in plain language. The lab will suggest a safer practice size for you.',
  },
  {
    title: '3. Review what happened',
    body: 'When you sell, write down what you learned. The dashboard turns that into feedback you can use.',
  },
];

export const GUIDED_FLOW = {
  sectionTitle: 'Guided practice trade',
  sectionSubtitle:
    'Six short steps. Plain language first; the investing term is shown underneath so you learn it as you go.',
  steps: {
    pickCompany: {
      number: 1,
      title: 'Choose a company to practice with',
      hint: 'Use the leaderboard or any ticker you already follow.',
    },
    explainReason: {
      number: 2,
      title: 'Explain why it might become more valuable',
      term: 'Investors call this your investment thesis.',
      placeholder:
        'Example: Revenue is growing, debt is manageable, and the stock is cheaper than similar companies.',
    },
    wrongSignal: {
      number: 3,
      title: 'Decide what would prove the idea wrong',
      term: 'Investors call this an invalidation point.',
      placeholder: 'Example: Price falls below my wrong-price level or the company reports weaker earnings.',
      wrongPriceLabel: 'Your "I was wrong" price',
      wrongPriceHint: 'Used for position sizing.',
    },
    practiceRisk: {
      number: 4,
      title: 'Choose a small practice risk',
      term: 'Investors call this risk per trade.',
      maxLossLabel: 'Max practice loss',
      maxLossHint: 'How much you accept losing if wrong.',
      lossTypeLabel: 'Loss type',
      lossTypeHint: 'Amount or portfolio percent.',
    },
    reviewWindow: {
      number: 5,
      title: 'Choose when to check back',
      term: 'Investors call this a review condition.',
      placeholder: 'Example: Review after 30 days or after the next earnings report.',
    },
    placeTrade: {
      number: 6,
      title: 'Place the paper trade',
      hint: 'You can buy when the steps above are filled in.',
    },
  },
};

export const POSITIONS = {
  sectionTitle: 'Positions you are practicing with',
  emptyMessage: 'No positions yet. Complete the six steps above to place your first paper trade.',
  unplannedMessage:
    'This is unplanned practice history from before the guided lab. Future trades should include a plan.',
  reviewButtonLabel: 'Review and sell',
  hints: {
    pastWrongPrice: 'Price is below your wrong-price. Time to review.',
    withinPlan: 'Keep watching. Review when your plan says to.',
  },
};

export const SELL_REVIEW = {
  panelTitle: 'Review and sell',
  panelSubtitle:
    'Selling records a review so the lab can teach from your decisions, not only from profit or loss.',
  outcomeLabel: 'Did your original idea work?',
  outcomeOptions: {
    worked: 'Worked',
    failed: 'Failed',
    unclear: 'Still unclear',
  },
  followedPlanLabel: 'Did you follow your plan?',
  mistakeLabel: 'Mistake type, if any',
  lessonLabel: 'What did you learn?',
  lessonPlaceholder:
    'Example: I bought before I understood the risk, or the plan worked but the position was too large.',
  cancelButtonLabel: 'Cancel',
  confirmSellButtonLabel: 'Record review and sell',
};

export const DASHBOARD = {
  sectionTitle: 'Learning Dashboard',
  cashLabel: 'Cash',
  portfolioValueLabel: 'Portfolio Value',
  totalPnlLabel: 'Total P/L',
  planFollowingTopLabel: 'Times you followed your plan',
  metrics: {
    completedPlans: 'Practice plans made',
    closedReviews: 'Trades reviewed',
    averageWin: 'Average win when you were right',
    averageLoss: 'Average loss when you were wrong',
    commonMistake: 'Mistake to watch for',
  },
  disclaimer: 'This is practice feedback, not financial advice or a promise of future returns.',
};

export const CHECKLIST = {
  sectionTitle: 'Your practice checklist',
  items: [
    'Pick one company you would like to learn about.',
    'Write a plain-language reason for buying.',
    'Write what would prove your idea wrong.',
    'Choose how much you would accept losing.',
    'Place one practice trade with a complete plan.',
    'After at least a week, review the trade and write down one lesson.',
  ] as const,
};

export const JOURNAL = {
  sectionTitle: 'Trading Journal',
  placeholder:
    'What pattern do you notice in your decisions? What will you do differently in the next practice trade?',
};

export const RECENT_TRADES = {
  sectionTitle: 'Recent Trades',
  emptyMessage: 'No trades logged yet.',
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm --prefix frontend run build`
Expected: `tsc` step succeeds (no type errors); Vite build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/learningLab/copy.ts
git commit -m "feat(learning-lab): add beginner-flow copy module"
```

---

## Task 2: Create the index re-export

**Why:** Lets later tasks import from `'../components/learningLab'` without churning paths each time a component is added.

**Files:**
- Create: `frontend/src/components/learningLab/index.ts`

- [ ] **Step 1: Create a placeholder index that only re-exports copy for now**

```ts
// frontend/src/components/learningLab/index.ts
export * as LearningLabCopy from './copy';
```

- [ ] **Step 2: Verify it compiles**

Run: `npm --prefix frontend run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/learningLab/index.ts
git commit -m "feat(learning-lab): add learningLab component barrel"
```

---

## Task 3: Build the PracticeIntroPanel component

**Files:**
- Create: `frontend/src/components/learningLab/PracticeIntroPanel.tsx`
- Modify: `frontend/src/components/learningLab/index.ts`

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/components/learningLab/PracticeIntroPanel.tsx
import { INTRO_STEPS, PAGE_HEADER } from './copy';

export default function PracticeIntroPanel() {
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">{PAGE_HEADER.title}</h2>
        <p className="text-gray-300 mt-2">{PAGE_HEADER.subtitle}</p>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {INTRO_STEPS.map((step) => (
          <li
            key={step.title}
            className="rounded-xl bg-gray-900/40 border border-white/10 p-3"
          >
            <p className="text-white font-semibold">{step.title}</p>
            <p className="text-sm text-gray-300 mt-1">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Re-export from the barrel**

Update `frontend/src/components/learningLab/index.ts` to:

```ts
export * as LearningLabCopy from './copy';
export { default as PracticeIntroPanel } from './PracticeIntroPanel';
```

- [ ] **Step 3: Verify it compiles and lints**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/learningLab/PracticeIntroPanel.tsx frontend/src/components/learningLab/index.ts
git commit -m "feat(learning-lab): add PracticeIntroPanel"
```

---

## Task 4: Wire PracticeIntroPanel into LearningLab.tsx

**Files:**
- Modify: `frontend/src/pages/LearningLab.tsx` (replace the existing top header block)

- [ ] **Step 1: Replace the page header block**

Open `frontend/src/pages/LearningLab.tsx`. Find the JSX block that begins with `<div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">` and ends with the closing `</div>` of that block (currently the page-title card). Replace the entire block with:

```tsx
<PracticeIntroPanel />
```

Add this import near the existing imports:

```ts
import { PracticeIntroPanel } from '../components/learningLab';
```

- [ ] **Step 2: Verify build + lint**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: success.

- [ ] **Step 3: Manual UI check**

Run: `npm --prefix frontend run dev` (start the frontend; backend connection not required for the page render itself, though leaderboard fetch will fail gracefully).
Open the Learning Lab page in the browser.
Expected: the green header card now shows the new title "Practice investing without real money", the subtitle, and three numbered intro cards. No console errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/LearningLab.tsx
git commit -m "feat(learning-lab): replace page header with PracticeIntroPanel"
```

---

## Task 5: Build the GuidedPracticeFlow component

**Why this is the largest task:** The numbered six-step flow is the visual centerpiece of the redesign. To keep the diff in `LearningLab.tsx` clean, we extract the entire trade-plan UI plus the ticker/share inputs and the buy button into a single component that receives state and handlers as props. Sell controls move out (handled in Task 7).

**Files:**
- Create: `frontend/src/components/learningLab/GuidedPracticeFlow.tsx`
- Modify: `frontend/src/components/learningLab/index.ts`

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/components/learningLab/GuidedPracticeFlow.tsx
import type {
  PositionSizeResult,
  TradePlanForm,
} from '../../types/learningLab';
import { GUIDED_FLOW } from './copy';

interface TickerOption {
  ticker: string;
  name: string;
}

interface GuidedPracticeFlowProps {
  tickerOptions: TickerOption[];
  selectedTicker: string;
  onSelectedTickerChange: (ticker: string) => void;
  loadingIdeas: boolean;
  sharesInput: string;
  onSharesInputChange: (value: string) => void;
  watchPriceLabel: string;
  planForm: TradePlanForm;
  onPlanFormChange: (next: TradePlanForm) => void;
  positionSize: PositionSizeResult;
  isOversizedTrade: boolean;
  canBuy: boolean;
  isExecutingTrade: boolean;
  onBuy: () => void;
  onResetSimulator: () => void;
  onRefreshPrices: () => void;
  actionMessage: string;
}

function StepHeader({ number, title, hint }: { number: number; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
        {number}
      </span>
      <div>
        <h4 className="text-white font-semibold">{title}</h4>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
    </div>
  );
}

export default function GuidedPracticeFlow(props: GuidedPracticeFlowProps) {
  const {
    tickerOptions,
    selectedTicker,
    onSelectedTickerChange,
    loadingIdeas,
    sharesInput,
    onSharesInputChange,
    watchPriceLabel,
    planForm,
    onPlanFormChange,
    positionSize,
    isOversizedTrade,
    canBuy,
    isExecutingTrade,
    onBuy,
    onResetSimulator,
    onRefreshPrices,
    actionMessage,
  } = props;

  const updatePlan = (patch: Partial<TradePlanForm>) =>
    onPlanFormChange({ ...planForm, ...patch });

  const steps = GUIDED_FLOW.steps;

  return (
    <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4 space-y-6">
      <div>
        <h3 className="text-lg text-white font-semibold">{GUIDED_FLOW.sectionTitle}</h3>
        <p className="text-sm text-gray-400 mt-1">{GUIDED_FLOW.sectionSubtitle}</p>
      </div>

      <section className="space-y-3">
        <StepHeader
          number={steps.pickCompany.number}
          title={steps.pickCompany.title}
          hint={steps.pickCompany.hint}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedTicker}
            onChange={(e) => onSelectedTickerChange(e.target.value)}
            className="bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
          >
            {loadingIdeas && tickerOptions.length === 0 ? (
              <option>Loading...</option>
            ) : (
              tickerOptions.map((idea) => (
                <option key={idea.ticker} value={idea.ticker}>
                  {idea.ticker} · {idea.name}
                </option>
              ))
            )}
          </select>
          <input
            value={sharesInput}
            onChange={(e) => onSharesInputChange(e.target.value)}
            type="number"
            min="1"
            className="bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
            placeholder="Shares"
          />
          <div className="bg-gray-800 text-cyan-300 border border-white/10 rounded-lg px-3 py-2 flex items-center">
            Est. price: {watchPriceLabel}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <StepHeader number={steps.explainReason.number} title={steps.explainReason.title} />
        <span className="block text-xs text-cyan-300">{steps.explainReason.term}</span>
        <textarea
          value={planForm.reasonForBuying}
          onChange={(e) => updatePlan({ reasonForBuying: e.target.value })}
          className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-20"
          placeholder={steps.explainReason.placeholder}
        />
      </section>

      <section className="space-y-3">
        <StepHeader number={steps.wrongSignal.number} title={steps.wrongSignal.title} />
        <span className="block text-xs text-cyan-300">{steps.wrongSignal.term}</span>
        <textarea
          value={planForm.wrongSignal}
          onChange={(e) => updatePlan({ wrongSignal: e.target.value })}
          className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-16"
          placeholder={steps.wrongSignal.placeholder}
        />
        <label className="block max-w-xs">
          <span className="text-sm text-gray-200">{steps.wrongSignal.wrongPriceLabel}</span>
          <span className="block text-xs text-cyan-300 mt-1">{steps.wrongSignal.wrongPriceHint}</span>
          <input
            value={planForm.plannedWrongPrice}
            onChange={(e) => updatePlan({ plannedWrongPrice: e.target.value })}
            type="number"
            min="0"
            step="0.01"
            className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
            placeholder="80.00"
          />
        </label>
      </section>

      <section className="space-y-3">
        <StepHeader number={steps.practiceRisk.number} title={steps.practiceRisk.title} />
        <span className="block text-xs text-cyan-300">{steps.practiceRisk.term}</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-gray-200">{steps.practiceRisk.maxLossLabel}</span>
            <span className="block text-xs text-cyan-300 mt-1">{steps.practiceRisk.maxLossHint}</span>
            <input
              value={planForm.maxPracticeLoss}
              onChange={(e) => updatePlan({ maxPracticeLoss: e.target.value })}
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-200">{steps.practiceRisk.lossTypeLabel}</span>
            <span className="block text-xs text-cyan-300 mt-1">{steps.practiceRisk.lossTypeHint}</span>
            <select
              value={planForm.maxPracticeLossType}
              onChange={(e) =>
                updatePlan({
                  maxPracticeLossType: e.target.value as TradePlanForm['maxPracticeLossType'],
                })
              }
              className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
            >
              <option value="percent">% of portfolio</option>
              <option value="amount">Dollar amount</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <StepHeader number={steps.reviewWindow.number} title={steps.reviewWindow.title} />
        <span className="block text-xs text-cyan-300">{steps.reviewWindow.term}</span>
        <input
          value={planForm.reviewCondition}
          onChange={(e) => updatePlan({ reviewCondition: e.target.value })}
          className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
          placeholder={steps.reviewWindow.placeholder}
        />
      </section>

      <section className="space-y-3">
        <StepHeader
          number={steps.placeTrade.number}
          title={steps.placeTrade.title}
          hint={steps.placeTrade.hint}
        />
        <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/20 p-3">
          <p className="text-sm text-cyan-100">{positionSize.explanation}</p>
          {isOversizedTrade && (
            <p className="text-sm text-amber-300 mt-2">
              Your share amount is larger than the suggested practice size. You can continue, but this is
              riskier than your plan.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBuy}
            disabled={!canBuy || isExecutingTrade}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              canBuy && !isExecutingTrade
                ? 'bg-emerald-500/80 hover:bg-emerald-500'
                : 'bg-gray-700 cursor-not-allowed opacity-60'
            }`}
          >
            Place paper trade
          </button>
          <button
            type="button"
            onClick={onRefreshPrices}
            disabled={isExecutingTrade}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              isExecutingTrade
                ? 'bg-gray-700 cursor-not-allowed opacity-60'
                : 'bg-cyan-500/80 hover:bg-cyan-500'
            }`}
          >
            Refresh Prices
          </button>
          <button
            type="button"
            onClick={onResetSimulator}
            disabled={isExecutingTrade}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              isExecutingTrade
                ? 'bg-gray-700 cursor-not-allowed opacity-60'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Reset
          </button>
        </div>
        {actionMessage && <p className="text-sm text-cyan-300">{actionMessage}</p>}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Re-export from the barrel**

```ts
// frontend/src/components/learningLab/index.ts
export * as LearningLabCopy from './copy';
export { default as PracticeIntroPanel } from './PracticeIntroPanel';
export { default as GuidedPracticeFlow } from './GuidedPracticeFlow';
```

- [ ] **Step 3: Verify build + lint**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/learningLab/GuidedPracticeFlow.tsx frontend/src/components/learningLab/index.ts
git commit -m "feat(learning-lab): add GuidedPracticeFlow component"
```

---

## Task 6: Wire GuidedPracticeFlow into LearningLab.tsx

**Files:**
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Replace the Execution Console block**

In `frontend/src/pages/LearningLab.tsx`, find the JSX block headed by `<h3 className="text-lg text-white font-semibold">Execution Console</h3>` and ending with the closing `</div>` of the surrounding `rounded-xl bg-gray-900/60 …` card (this includes the ticker/shares row, plan card, sell-review card, button row, and `actionMessage` paragraph). Replace the entire block with:

```tsx
<GuidedPracticeFlow
  tickerOptions={tickerOptions}
  selectedTicker={selectedTicker}
  onSelectedTickerChange={setSelectedTicker}
  loadingIdeas={loadingIdeas}
  sharesInput={sharesInput}
  onSharesInputChange={setSharesInput}
  watchPriceLabel={formatMoney(watchPrice || 0)}
  planForm={planForm}
  onPlanFormChange={setPlanForm}
  positionSize={positionSize}
  isOversizedTrade={isOversizedTrade}
  canBuy={canBuy}
  isExecutingTrade={isExecutingTrade}
  onBuy={() => executeTrade('BUY')}
  onResetSimulator={resetSimulator}
  onRefreshPrices={refreshPositionPrices}
  actionMessage={actionMessage}
/>
```

Update the imports at the top of the file:

```ts
import { GuidedPracticeFlow, PracticeIntroPanel } from '../components/learningLab';
```

This deliberately removes the inline Sell button and the always-visible sell-review card. Sell will be re-introduced via the `SellReviewPanel` in Task 9. Until then, expect: a user with an existing open position cannot sell from the page. We'll bridge that gap in Tasks 7–9 *before* declaring the redesign complete.

- [ ] **Step 2: Verify build + lint**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: success. If TypeScript flags `sellReviewForm` / `setSellReviewForm` as unused, leave them — Task 9 will use them.

If the lint step fails on unused vars, suppress only the ones flagged here by *temporarily* keeping them used: comment out those `useState` calls and re-add them in Task 9. Do **not** delete them.

- [ ] **Step 3: Manual UI check**

Run: `npm --prefix frontend run dev`
Open the Learning Lab page.
Expected:
1. The new "Guided practice trade" section is visible with six numbered steps.
2. Filling all four plan prompts enables the **Place paper trade** button.
3. Clicking it runs the existing buy flow (an `actionMessage` appears, position is added to "Open Positions").
4. The old "Execution Console" header and the sell-review card are gone.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/LearningLab.tsx
git commit -m "feat(learning-lab): replace Execution Console with GuidedPracticeFlow"
```

---

## Task 7: Add reviewingPositionTicker state

**Why now:** The remaining presentational components (PracticePositions, SellReviewPanel) will read and write this state. Adding it as a separate small step keeps that diff focused.

**Files:**
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Add the state**

Inside `LearningLab()`, after the existing `const [isExecutingTrade, setIsExecutingTrade] = useState(false);` line, add:

```ts
const [reviewingPositionTicker, setReviewingPositionTicker] = useState<string | null>(null);
```

- [ ] **Step 2: Add a helper to open the review panel for a position**

Just below `commitSimulatorState`, add:

```ts
const openReviewForPosition = (ticker: string) => {
  if (isExecutingTradeRef.current) {
    setActionMessage('Wait for the current practice order to finish before reviewing a position.');
    return;
  }
  const position = stateRef.current.positions.find((p) => p.ticker === ticker);
  if (!position) {
    return;
  }
  setReviewingPositionTicker(ticker);
  setSharesInput(String(position.shares));
  setSellReviewForm(createDefaultSellReviewForm());
};

const closeReview = () => setReviewingPositionTicker(null);
```

- [ ] **Step 3: Adjust the SELL execution path to use the reviewed ticker**

Find `executeTrade` and the early validation block:

```ts
if (!selectedTicker || !Number.isFinite(shares) || shares <= 0) {
  setActionMessage('Pick a ticker and valid share amount.');
  return;
}
```

Replace with:

```ts
const reviewTicker = type === 'SELL' ? reviewingPositionTicker : null;
const tradeTicker = reviewTicker ?? selectedTicker;
if (!tradeTicker || !Number.isFinite(shares) || shares <= 0) {
  setActionMessage('Pick a ticker and valid share amount.');
  return;
}
```

Then, throughout the rest of `executeTrade`, replace every reference to `selectedTicker` *that targets the trade itself* (the variable used as `selectedTicker` in `applyLearningLabBuyTrade`/`applyLearningLabSellTrade` calls, position lookups, `marketIdeas.find`, the success message) with `tradeTicker`. **Do not** change the React state setter; the component-level `selectedTicker` still drives the buy ticker selector.

After a successful SELL, also call `setReviewingPositionTicker(null)` in the same place where `setSellReviewForm(createDefaultSellReviewForm())` is called.

- [ ] **Step 4: Verify build + lint**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: success. If lint flags `reviewingPositionTicker` / `setReviewingPositionTicker` / `openReviewForPosition` / `closeReview` as unused, leave them — Tasks 8–9 use them.

- [ ] **Step 5: Manual UI check**

Run: `npm --prefix frontend run dev`
Open the Learning Lab page.
Expected: page renders unchanged from Task 6. Buying still works. No console errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/LearningLab.tsx
git commit -m "feat(learning-lab): add reviewingPositionTicker state and route SELL through it"
```

---

## Task 8: Build PracticePositionCard and PracticePositions

**Files:**
- Create: `frontend/src/components/learningLab/PracticePositionCard.tsx`
- Create: `frontend/src/components/learningLab/PracticePositions.tsx`
- Modify: `frontend/src/components/learningLab/index.ts`

- [ ] **Step 1: Write `PracticePositionCard.tsx`**

```tsx
// frontend/src/components/learningLab/PracticePositionCard.tsx
import type { Position, TradePlan } from '../../types/learningLab';
import { POSITIONS } from './copy';

interface PracticePositionCardProps {
  position: Position;
  plan?: TradePlan;
  formatMoney: (value: number) => string;
  onReviewAndSell: (ticker: string) => void;
  reviewActive: boolean;
}

export default function PracticePositionCard({
  position,
  plan,
  formatMoney,
  onReviewAndSell,
  reviewActive,
}: PracticePositionCardProps) {
  const unrealized = (position.currentPrice - position.avgCost) * position.shares;
  const plannedWrongPrice = plan?.plannedWrongPrice;
  const withinPlannedRisk = plannedWrongPrice == null || position.currentPrice >= plannedWrongPrice;
  const nextActionHint = withinPlannedRisk
    ? POSITIONS.hints.withinPlan
    : POSITIONS.hints.pastWrongPrice;

  return (
    <div className="bg-gray-800/70 border border-white/10 rounded-lg p-3 space-y-3">
      <div className="flex justify-between gap-4">
        <p className="text-white font-medium">
          {position.ticker} · {position.name}
        </p>
        <p className={unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatMoney(unrealized)}</p>
      </div>
      <p className="text-xs text-gray-400">
        {position.shares} shares · Avg {formatMoney(position.avgCost)} · Last {formatMoney(position.currentPrice)}
      </p>
      {plan ? (
        <div className="space-y-1 text-xs">
          <p className="text-gray-300">
            <span className="text-cyan-300">Reason:</span> {plan.reasonForBuying}
          </p>
          <p className="text-gray-300">
            <span className="text-cyan-300">Wrong signal:</span> {plan.wrongSignal}
          </p>
          <p className="text-gray-300">
            <span className="text-cyan-300">Review:</span> {plan.reviewCondition}
          </p>
          <p className={withinPlannedRisk ? 'text-emerald-300' : 'text-amber-300'}>{nextActionHint}</p>
        </div>
      ) : (
        <p className="text-xs text-amber-300">{POSITIONS.unplannedMessage}</p>
      )}
      <button
        type="button"
        onClick={() => onReviewAndSell(position.ticker)}
        disabled={reviewActive}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
          reviewActive
            ? 'bg-gray-700 cursor-not-allowed opacity-60 text-white'
            : 'bg-amber-500/80 hover:bg-amber-500 text-white'
        }`}
      >
        {POSITIONS.reviewButtonLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write `PracticePositions.tsx`**

```tsx
// frontend/src/components/learningLab/PracticePositions.tsx
import type { Position, TradePlan } from '../../types/learningLab';
import { POSITIONS } from './copy';
import PracticePositionCard from './PracticePositionCard';

interface PracticePositionsProps {
  positions: Position[];
  plansById: Map<string, TradePlan>;
  formatMoney: (value: number) => string;
  onReviewAndSell: (ticker: string) => void;
  reviewingTicker: string | null;
}

export default function PracticePositions({
  positions,
  plansById,
  formatMoney,
  onReviewAndSell,
  reviewingTicker,
}: PracticePositionsProps) {
  return (
    <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
      <h3 className="text-lg text-white font-semibold mb-3">{POSITIONS.sectionTitle}</h3>
      {positions.length === 0 ? (
        <p className="text-gray-400">{POSITIONS.emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {positions.map((position) => (
            <PracticePositionCard
              key={position.ticker}
              position={position}
              plan={position.planId ? plansById.get(position.planId) : undefined}
              formatMoney={formatMoney}
              onReviewAndSell={onReviewAndSell}
              reviewActive={reviewingTicker === position.ticker}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Re-export from the barrel**

```ts
// frontend/src/components/learningLab/index.ts
export * as LearningLabCopy from './copy';
export { default as PracticeIntroPanel } from './PracticeIntroPanel';
export { default as GuidedPracticeFlow } from './GuidedPracticeFlow';
export { default as PracticePositions } from './PracticePositions';
```

- [ ] **Step 4: Replace the existing Open Positions block in `LearningLab.tsx`**

Find the JSX block headed by `<h3 className="text-lg text-white font-semibold mb-3">Open Positions</h3>`. Replace the surrounding `rounded-xl bg-gray-900/60 …` card with:

```tsx
<PracticePositions
  positions={state.positions}
  plansById={plansById}
  formatMoney={formatMoney}
  onReviewAndSell={openReviewForPosition}
  reviewingTicker={reviewingPositionTicker}
/>
```

Update imports:

```ts
import {
  GuidedPracticeFlow,
  PracticeIntroPanel,
  PracticePositions,
} from '../components/learningLab';
```

- [ ] **Step 5: Verify build + lint**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: success.

- [ ] **Step 6: Manual UI check**

Run: `npm --prefix frontend run dev`
Open the Learning Lab page. If you have no open positions, place one paper trade first via the guided flow.
Expected:
1. The section heading reads "Positions you are practicing with".
2. Each position card has a "Review and sell" button (amber).
3. Clicking the button does not yet open a panel (panel comes in Task 9), but does NOT crash. `reviewingPositionTicker` is set; the button on that card becomes disabled/dimmed; the shares input updates to the position's share count.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/learningLab/PracticePositionCard.tsx frontend/src/components/learningLab/PracticePositions.tsx frontend/src/components/learningLab/index.ts frontend/src/pages/LearningLab.tsx
git commit -m "feat(learning-lab): reframe open positions as practice positions with Review and sell"
```

---

## Task 9: Build SellReviewPanel and reintroduce SELL

**Files:**
- Create: `frontend/src/components/learningLab/SellReviewPanel.tsx`
- Modify: `frontend/src/components/learningLab/index.ts`
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Write `SellReviewPanel.tsx`**

```tsx
// frontend/src/components/learningLab/SellReviewPanel.tsx
import type { Position, SellReviewForm } from '../../types/learningLab';
import { SELL_REVIEW } from './copy';

interface SellReviewPanelProps {
  position: Position;
  sellReviewForm: SellReviewForm;
  onSellReviewFormChange: (next: SellReviewForm) => void;
  sharesInput: string;
  onSharesInputChange: (value: string) => void;
  isExecutingTrade: boolean;
  onConfirmSell: () => void;
  onCancel: () => void;
}

export default function SellReviewPanel({
  position,
  sellReviewForm,
  onSellReviewFormChange,
  sharesInput,
  onSharesInputChange,
  isExecutingTrade,
  onConfirmSell,
  onCancel,
}: SellReviewPanelProps) {
  const update = (patch: Partial<SellReviewForm>) =>
    onSellReviewFormChange({ ...sellReviewForm, ...patch });

  return (
    <div className="rounded-xl bg-gray-950/60 border border-amber-400/30 p-4 space-y-4">
      <div>
        <h3 className="text-lg text-white font-semibold">{SELL_REVIEW.panelTitle}</h3>
        <p className="text-sm text-gray-400 mt-1">{SELL_REVIEW.panelSubtitle}</p>
        <p className="text-xs text-amber-300 mt-2">
          Reviewing {position.ticker} · {position.name} ({position.shares} shares).
        </p>
      </div>

      <label className="block max-w-xs">
        <span className="text-sm text-gray-200">Shares to sell</span>
        <input
          value={sharesInput}
          onChange={(e) => onSharesInputChange(e.target.value)}
          type="number"
          min="1"
          max={position.shares}
          className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-sm text-gray-200">{SELL_REVIEW.outcomeLabel}</span>
          <select
            value={sellReviewForm.outcome}
            onChange={(e) => update({ outcome: e.target.value as SellReviewForm['outcome'] })}
            className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
          >
            <option value="worked">{SELL_REVIEW.outcomeOptions.worked}</option>
            <option value="failed">{SELL_REVIEW.outcomeOptions.failed}</option>
            <option value="unclear">{SELL_REVIEW.outcomeOptions.unclear}</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-gray-200">{SELL_REVIEW.followedPlanLabel}</span>
          <select
            value={sellReviewForm.followedPlan ? 'yes' : 'no'}
            onChange={(e) => update({ followedPlan: e.target.value === 'yes' })}
            className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-gray-200">{SELL_REVIEW.mistakeLabel}</span>
          <select
            value={sellReviewForm.mistakeType}
            onChange={(e) => update({ mistakeType: e.target.value as SellReviewForm['mistakeType'] })}
            className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
          >
            <option value="">No mistake selected</option>
            <option value="no_reason">No clear reason</option>
            <option value="too_large">Position too large</option>
            <option value="ignored_warning">Ignored warning sign</option>
            <option value="emotional_sell">Sold emotionally</option>
            <option value="score_only">Bought only because score was high</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-gray-200">{SELL_REVIEW.lessonLabel}</span>
        <textarea
          value={sellReviewForm.lessonLearned}
          onChange={(e) => update({ lessonLearned: e.target.value })}
          className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-16"
          placeholder={SELL_REVIEW.lessonPlaceholder}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirmSell}
          disabled={isExecutingTrade}
          className={`px-4 py-2 rounded-lg text-white font-medium ${
            isExecutingTrade
              ? 'bg-gray-700 cursor-not-allowed opacity-60'
              : 'bg-red-500/80 hover:bg-red-500'
          }`}
        >
          {SELL_REVIEW.confirmSellButtonLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isExecutingTrade}
          className={`px-4 py-2 rounded-lg text-white font-medium ${
            isExecutingTrade
              ? 'bg-gray-700 cursor-not-allowed opacity-60'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {SELL_REVIEW.cancelButtonLabel}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Re-export from the barrel**

```ts
// frontend/src/components/learningLab/index.ts
export * as LearningLabCopy from './copy';
export { default as PracticeIntroPanel } from './PracticeIntroPanel';
export { default as GuidedPracticeFlow } from './GuidedPracticeFlow';
export { default as PracticePositions } from './PracticePositions';
export { default as SellReviewPanel } from './SellReviewPanel';
```

- [ ] **Step 3: Render the panel conditionally in `LearningLab.tsx`**

Add the import:

```ts
import {
  GuidedPracticeFlow,
  PracticeIntroPanel,
  PracticePositions,
  SellReviewPanel,
} from '../components/learningLab';
```

In the JSX, immediately above the `<PracticePositions … />` render, add:

```tsx
{reviewingPositionTicker && (() => {
  const reviewedPosition = state.positions.find((p) => p.ticker === reviewingPositionTicker);
  if (!reviewedPosition) {
    return null;
  }
  return (
    <SellReviewPanel
      position={reviewedPosition}
      sellReviewForm={sellReviewForm}
      onSellReviewFormChange={setSellReviewForm}
      sharesInput={sharesInput}
      onSharesInputChange={setSharesInput}
      isExecutingTrade={isExecutingTrade}
      onConfirmSell={() => executeTrade('SELL')}
      onCancel={closeReview}
    />
  );
})()}
```

If `reviewingPositionTicker` is set but the position no longer exists (e.g. after a successful sell that closed it), the inline `null` keeps the page stable until the next render clears the ticker.

- [ ] **Step 4: Verify build + lint**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: success. The previously unused `sellReviewForm`, `setSellReviewForm`, `reviewingPositionTicker`, `setReviewingPositionTicker`, `openReviewForPosition`, and `closeReview` are now all in use.

- [ ] **Step 5: Manual UI check**

Run: `npm --prefix frontend run dev`
Open the Learning Lab page.
Expected end-to-end flow:
1. Place a paper buy via the guided flow. Position appears under "Positions you are practicing with".
2. Click "Review and sell" on that position. The amber sell-review panel appears between the guided flow and the positions list. Shares-to-sell defaults to the position's share count.
3. Pick an outcome, write a one-line lesson, and click "Record review and sell". A success message appears, the position is removed (or shares reduced), and the review panel disappears. `Recent Trades` lists the new SELL with its review summary.
4. Click "Review and sell" on a position, then "Cancel". The panel closes; the position remains; the review form is reset.
5. While reviewing, the same position's "Review and sell" button is dimmed/disabled.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/learningLab/SellReviewPanel.tsx frontend/src/components/learningLab/index.ts frontend/src/pages/LearningLab.tsx
git commit -m "feat(learning-lab): defer sell review behind per-position panel"
```

---

## Task 10: Reframe the Learning Dashboard labels

**Files:**
- Create: `frontend/src/components/learningLab/LearningDashboardCard.tsx`
- Modify: `frontend/src/components/learningLab/index.ts`
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Write the dashboard card component**

```tsx
// frontend/src/components/learningLab/LearningDashboardCard.tsx
import type { LearningDashboardMetrics } from '../../types/learningLab';
import { DASHBOARD } from './copy';

interface LearningDashboardCardProps {
  metrics: LearningDashboardMetrics;
  formatMoney: (value: number) => string;
}

export default function LearningDashboardCard({
  metrics,
  formatMoney,
}: LearningDashboardCardProps) {
  return (
    <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
      <h3 className="text-lg text-white font-semibold mb-3">{DASHBOARD.sectionTitle}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-gray-800/70 p-3">
          <p className="text-gray-400">{DASHBOARD.metrics.completedPlans}</p>
          <p className="text-white text-lg font-semibold">{metrics.completedPlans}</p>
        </div>
        <div className="rounded-lg bg-gray-800/70 p-3">
          <p className="text-gray-400">{DASHBOARD.metrics.closedReviews}</p>
          <p className="text-white text-lg font-semibold">{metrics.closedReviews}</p>
        </div>
        <div className="rounded-lg bg-gray-800/70 p-3">
          <p className="text-gray-400">{DASHBOARD.metrics.averageWin}</p>
          <p className="text-emerald-400 text-lg font-semibold">{formatMoney(metrics.averageWin)}</p>
        </div>
        <div className="rounded-lg bg-gray-800/70 p-3">
          <p className="text-gray-400">{DASHBOARD.metrics.averageLoss}</p>
          <p className="text-red-400 text-lg font-semibold">{formatMoney(metrics.averageLoss)}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        {DASHBOARD.metrics.commonMistake}:{' '}
        {metrics.commonMistake ? metrics.commonMistake.replace(/_/g, ' ') : 'none recorded yet'}
      </p>
      <p className="text-xs text-gray-500 mt-2">{DASHBOARD.disclaimer}</p>
    </div>
  );
}
```

- [ ] **Step 2: Re-export from the barrel**

```ts
// frontend/src/components/learningLab/index.ts (append)
export { default as LearningDashboardCard } from './LearningDashboardCard';
```

- [ ] **Step 3: Replace the inline dashboard card in `LearningLab.tsx`**

Find the JSX block headed by `<h3 className="text-lg text-white font-semibold mb-3">Learning Dashboard</h3>`. Replace its surrounding `rounded-xl bg-gray-900/60 …` card with:

```tsx
<LearningDashboardCard metrics={dashboardMetrics} formatMoney={formatMoney} />
```

Update the top-of-page metrics tile labels using the copy module. Locate the four-tile row that currently shows Cash / Portfolio Value / Total P/L / Plan Following. Replace its inline string labels:

```tsx
<p className="text-gray-400 text-xs">Cash</p>
```
becomes
```tsx
<p className="text-gray-400 text-xs">{LearningLabCopy.DASHBOARD.cashLabel}</p>
```

Apply the same substitution for the other three (`portfolioValueLabel`, `totalPnlLabel`, `planFollowingTopLabel`).

Add the import alongside the others (note: the barrel exports copy as `LearningLabCopy`):

```ts
import {
  GuidedPracticeFlow,
  LearningDashboardCard,
  LearningLabCopy,
  PracticeIntroPanel,
  PracticePositions,
  SellReviewPanel,
} from '../components/learningLab';
```

- [ ] **Step 4: Verify build + lint**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: success.

- [ ] **Step 5: Manual UI check**

Run: `npm --prefix frontend run dev`
Open the Learning Lab page.
Expected:
1. Top-of-page tiles read "Cash", "Portfolio Value", "Total P/L", and "Times you followed your plan".
2. The dashboard card title is still "Learning Dashboard" but the four metrics now read "Practice plans made", "Trades reviewed", "Average win when you were right", "Average loss when you were wrong".
3. The mistake line reads "Mistake to watch for: …".

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/learningLab/LearningDashboardCard.tsx frontend/src/components/learningLab/index.ts frontend/src/pages/LearningLab.tsx
git commit -m "feat(learning-lab): reframe dashboard labels as plain language"
```

---

## Task 11: Rename Learning Missions to Your practice checklist

**Files:**
- Create: `frontend/src/components/learningLab/PracticeChecklist.tsx`
- Modify: `frontend/src/components/learningLab/index.ts`
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Write the checklist component**

```tsx
// frontend/src/components/learningLab/PracticeChecklist.tsx
import { CHECKLIST } from './copy';

export default function PracticeChecklist() {
  return (
    <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
      <h3 className="text-lg text-white font-semibold mb-2">{CHECKLIST.sectionTitle}</h3>
      <ol className="space-y-2 text-sm text-gray-300 list-decimal pl-5">
        {CHECKLIST.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Re-export from the barrel**

```ts
// frontend/src/components/learningLab/index.ts (append)
export { default as PracticeChecklist } from './PracticeChecklist';
```

- [ ] **Step 3: Replace the Learning Missions block in `LearningLab.tsx`**

Find the JSX block headed by `<h3 className="text-lg text-white font-semibold mb-2">Learning Missions</h3>` and the surrounding `rounded-xl bg-gray-900/60 …` card. Replace it with:

```tsx
<PracticeChecklist />
```

Add `PracticeChecklist` to the imports.

- [ ] **Step 4: Verify build + lint**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: success.

- [ ] **Step 5: Manual UI check**

Run: `npm --prefix frontend run dev`
Open the Learning Lab page.
Expected: section title reads "Your practice checklist" with six numbered beginner-path items.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/learningLab/PracticeChecklist.tsx frontend/src/components/learningLab/index.ts frontend/src/pages/LearningLab.tsx
git commit -m "feat(learning-lab): rename Learning Missions to Your practice checklist"
```

---

## Task 12: Reframe remaining inline strings (Recent Trades, Journal)

**Files:**
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Switch the Trading Journal and Recent Trades headers/placeholders to use the copy module**

Find:
```tsx
<h3 className="text-lg text-white font-semibold mb-2">Trading Journal</h3>
```
and the textarea placeholder beneath it. Replace:
```tsx
<h3 className="text-lg text-white font-semibold mb-2">{LearningLabCopy.JOURNAL.sectionTitle}</h3>
```
and use `LearningLabCopy.JOURNAL.placeholder` for the textarea `placeholder`.

Find:
```tsx
<h3 className="text-lg text-white font-semibold mb-3">Recent Trades</h3>
```
and replace with `{LearningLabCopy.RECENT_TRADES.sectionTitle}`. Replace `No trades logged yet.` with `{LearningLabCopy.RECENT_TRADES.emptyMessage}`.

- [ ] **Step 2: Verify build + lint**

Run: `npm --prefix frontend run build && npm --prefix frontend run lint`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LearningLab.tsx
git commit -m "refactor(learning-lab): route Journal and Recent Trades copy through copy module"
```

---

## Task 13: Final QA walkthrough

**Files:** none

- [ ] **Step 1: Build, lint, and run the dev server one more time**

Run, in order:
```bash
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend run dev
```

- [ ] **Step 2: Walk through the redesigned Learning Lab in the browser**

Confirm each of the success-criteria items from the spec:
1. Page header reads "Practice investing without real money" with a three-step beginner intro panel below it.
2. The metrics tile row shows the four reframed labels.
3. The middle column shows "Guided practice trade" with six numbered steps; the buy button is enabled only when the four plan prompts are filled in; placing a paper trade adds a position.
4. The sell-review form is **not** visible by default. It only appears after clicking "Review and sell" on a position.
5. Reviewing and selling completes the loop: the trade appears in Recent Trades with the review summary, the position reduces or disappears, the review panel closes.
6. The dashboard column reads "Learning Dashboard" with the four reframed metric labels and the "Mistake to watch for" line.
7. The "Your practice checklist" card lists six numbered beginner-path items.
8. The Trading Journal section is unchanged in functionality and reads "Trading Journal" with the new placeholder.
9. The Recent Trades section is unchanged in functionality.
10. No console errors at any point.

- [ ] **Step 3: Stop the dev server and confirm the working tree is clean**

Run: `git status`
Expected: clean working tree (all changes committed).

- [ ] **Step 4: No final commit needed unless QA reveals follow-ups.**

If anything fails at this step, return to the relevant task and fix it there rather than papering over it in a final commit.

---

## Self-Review Pass

Spec coverage check (against `docs/superpowers/specs/2026-04-26-learning-lab-beginner-ux-design.md`):

- [x] Reframe page title — Task 4 (PracticeIntroPanel header).
- [x] Beginner landing panel with three steps — Task 4.
- [x] Six-step guided practice trade flow — Tasks 5–6 (`GuidedPracticeFlow`).
- [x] Plain-language prompt → term → explanation per step — Task 1 (copy) + Task 5 (component layout).
- [x] Hide sell review until "Review and sell" clicked — Tasks 7–9.
- [x] Reframe open positions with next-action hint — Task 8 (`PracticePositionCard`).
- [x] Renamed dashboard labels — Task 10.
- [x] "Your practice checklist" — Task 11.
- [x] No type or util changes — out-of-scope guard rails restated in this plan's File Structure section and Task 13 walkthrough.
- [x] Manual verification used in lieu of tests — every task that touches rendered UI has a manual UI check.

Placeholder scan: no TBD/TODO; every code step is shown in full; type names (`SellReviewForm`, `TradePlanForm`, `Position`, `TradePlan`, `LearningDashboardMetrics`, `PositionSizeResult`) match those exported from `frontend/src/types/learningLab.ts`.

Type/identifier consistency: `reviewingPositionTicker`, `openReviewForPosition`, `closeReview`, `tradeTicker` are introduced in Task 7 and used in Tasks 8–9. The `LearningLabCopy` namespace is introduced in Task 2 and consumed in Tasks 10–12.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-26-learning-lab-beginner-ux.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task with two-stage review, ideal for this plan because each task is small and the build/lint loop catches drift between subagents.
2. **Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, with checkpoints between tasks.

Which approach?
