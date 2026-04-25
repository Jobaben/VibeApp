# Learning Lab Investor Training Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Learning Lab from a simple paper portfolio into a beginner-friendly investor practice loop with trade plans, risk sizing, sell reviews, and process-quality feedback.

**Architecture:** Keep persistence in localStorage for this slice, but split Learning Lab domain types and pure calculations into focused files before changing the page UI. `LearningLab.tsx` remains the page orchestrator; helper modules own state shape, migration, sizing math, dashboard metrics, and form defaults.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, localStorage, existing `stockApi`.

---

## File Structure

- Create `frontend/src/types/learningLab.ts`: domain types for simulator state, trade plans, reviews, mistake types, and dashboard metrics.
- Create `frontend/src/utils/learningLab.ts`: pure helpers for default state, localStorage migration, position sizing, dashboard metrics, and formatting-safe calculations.
- Modify `frontend/src/pages/LearningLab.tsx`: use the new types/helpers, replace the free-text reason field with a guided plan, add sizing guidance, add sell review, enrich positions, and show learning dashboard metrics.
- Modify `docs/features/LEARNING_MODE_PLAN.md`: add a short note that Learning Lab now owns the practical investor training loop.

No backend files change in this implementation slice.

---

### Task 1: Extract Learning Lab Domain Types

**Files:**
- Create: `frontend/src/types/learningLab.ts`
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Create the type file**

Create `frontend/src/types/learningLab.ts`:

```ts
export type MaxPracticeLossType = 'amount' | 'percent';

export type TradeOutcome = 'worked' | 'failed' | 'unclear';

export type MistakeType =
  | 'no_reason'
  | 'too_large'
  | 'ignored_warning'
  | 'emotional_sell'
  | 'score_only'
  | 'other';

export interface TradePlan {
  id: string;
  ticker: string;
  reasonForBuying: string;
  wrongSignal: string;
  reviewCondition: string;
  maxPracticeLoss: number;
  maxPracticeLossType: MaxPracticeLossType;
  plannedEntryPrice: number;
  plannedWrongPrice?: number;
  suggestedShares?: number;
  createdAt: string;
}

export interface TradeReview {
  tradeId: string;
  outcome: TradeOutcome;
  followedPlan: boolean;
  lessonLearned: string;
  mistakeType?: MistakeType;
  reviewedAt: string;
}

export interface Position {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  planId?: string;
}

export interface Trade {
  id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  timestamp: string;
  reason: string;
  planId?: string;
  review?: TradeReview;
  realizedPnl?: number;
}

export interface SimulatorState {
  cash: number;
  positions: Position[];
  trades: Trade[];
  plans: TradePlan[];
  journal: string;
  recoveryMessage?: string;
}

export interface TradePlanForm {
  reasonForBuying: string;
  wrongSignal: string;
  reviewCondition: string;
  maxPracticeLoss: string;
  maxPracticeLossType: MaxPracticeLossType;
  plannedWrongPrice: string;
}

export interface SellReviewForm {
  outcome: TradeOutcome;
  followedPlan: boolean;
  lessonLearned: string;
  mistakeType: MistakeType | '';
}

export interface PositionSizeResult {
  suggestedShares: number;
  plannedLossPerShare: number;
  maxLossAmount: number;
  explanation: string;
  missingReason?: string;
}

export interface LearningDashboardMetrics {
  completedPlans: number;
  closedReviews: number;
  planFollowingRate: number;
  averageWin: number;
  averageLoss: number;
  commonMistake: MistakeType | null;
}
```

- [ ] **Step 2: Import extracted types in the page**

In `frontend/src/pages/LearningLab.tsx`, remove the local `Position`, `Trade`, and `SimulatorState` interfaces and add:

```ts
import type {
  Position,
  SellReviewForm,
  SimulatorState,
  TradePlan,
  TradePlanForm,
} from '../types/learningLab';
```

- [ ] **Step 3: Add temporary state shape compatibility**

In `frontend/src/pages/LearningLab.tsx`, change the default state shape so TypeScript compiles before helper extraction:

```ts
const createDefaultState = (): SimulatorState => ({
  cash: STARTING_CASH,
  positions: [],
  trades: [],
  plans: [],
  journal: '',
});
```

Then update existing default state literals in `loadState`, `useState`, and `resetSimulator` to call `createDefaultState()`.

- [ ] **Step 4: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds. If TypeScript reports unused imported types, remove unused imports until the build passes.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/learningLab.ts frontend/src/pages/LearningLab.tsx
git commit -m "refactor: extract learning lab domain types"
```

---

### Task 2: Add Pure Learning Lab Helpers

**Files:**
- Create: `frontend/src/utils/learningLab.ts`
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Create helper module**

Create `frontend/src/utils/learningLab.ts`:

```ts
import type {
  LearningDashboardMetrics,
  MistakeType,
  Position,
  PositionSizeResult,
  SimulatorState,
  Trade,
  TradePlanForm,
} from '../types/learningLab';

export const STARTING_CASH = 100000;

export function createDefaultLearningLabState(recoveryMessage?: string): SimulatorState {
  return {
    cash: STARTING_CASH,
    positions: [],
    trades: [],
    plans: [],
    journal: '',
    recoveryMessage,
  };
}

export function migrateLearningLabState(raw: string | null): SimulatorState {
  if (!raw) {
    return createDefaultLearningLabState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SimulatorState>;
    return {
      cash: typeof parsed.cash === 'number' ? parsed.cash : STARTING_CASH,
      positions: Array.isArray(parsed.positions) ? parsed.positions : [],
      trades: Array.isArray(parsed.trades) ? parsed.trades : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      journal: typeof parsed.journal === 'string' ? parsed.journal : '',
    };
  } catch {
    return createDefaultLearningLabState('We reset the simulator because saved practice data was unreadable.');
  }
}

export function calculatePortfolioValue(cash: number, positions: Position[]): number {
  return cash + positions.reduce((sum, position) => sum + position.shares * position.currentPrice, 0);
}

export function calculatePositionSize(
  form: TradePlanForm,
  entryPrice: number,
  portfolioValue: number
): PositionSizeResult {
  const maxPracticeLoss = Number(form.maxPracticeLoss);
  const plannedWrongPrice = Number(form.plannedWrongPrice);

  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    return {
      suggestedShares: 0,
      plannedLossPerShare: 0,
      maxLossAmount: 0,
      explanation: 'Pick a company with a usable estimated price before sizing the position.',
      missingReason: 'missing_entry_price',
    };
  }

  if (!Number.isFinite(maxPracticeLoss) || maxPracticeLoss <= 0) {
    return {
      suggestedShares: 0,
      plannedLossPerShare: 0,
      maxLossAmount: 0,
      explanation: 'Add the most you are willing to lose in this practice trade.',
      missingReason: 'missing_max_loss',
    };
  }

  if (!Number.isFinite(plannedWrongPrice) || plannedWrongPrice <= 0 || plannedWrongPrice >= entryPrice) {
    return {
      suggestedShares: 0,
      plannedLossPerShare: 0,
      maxLossAmount: 0,
      explanation: 'Add an "I was wrong" price below the current estimated price.',
      missingReason: 'missing_wrong_price',
    };
  }

  const maxLossAmount = form.maxPracticeLossType === 'percent'
    ? portfolioValue * (maxPracticeLoss / 100)
    : maxPracticeLoss;
  const plannedLossPerShare = entryPrice - plannedWrongPrice;
  const suggestedShares = Math.max(0, Math.floor(maxLossAmount / plannedLossPerShare));

  return {
    suggestedShares,
    plannedLossPerShare,
    maxLossAmount,
    explanation: `If the idea is wrong at ${formatMoneyForLearningLab(plannedWrongPrice)}, each share risks about ${formatMoneyForLearningLab(plannedLossPerShare)}. To keep the planned loss near ${formatMoneyForLearningLab(maxLossAmount)}, practice with up to ${suggestedShares} shares.`,
  };
}

export function isTradePlanComplete(form: TradePlanForm): boolean {
  return (
    form.reasonForBuying.trim().length > 0 &&
    form.wrongSignal.trim().length > 0 &&
    form.reviewCondition.trim().length > 0 &&
    Number(form.maxPracticeLoss) > 0 &&
    Number(form.plannedWrongPrice) > 0
  );
}

export function calculateRealizedPnl(position: Position, sharesSold: number, sellPrice: number): number {
  return (sellPrice - position.avgCost) * sharesSold;
}

export function calculateDashboardMetrics(trades: Trade[]): LearningDashboardMetrics {
  const buyTradesWithPlans = trades.filter((trade) => trade.type === 'BUY' && trade.planId);
  const reviewedSellTrades = trades.filter((trade) => trade.type === 'SELL' && trade.review);
  const planFollowingCount = reviewedSellTrades.filter((trade) => trade.review?.followedPlan).length;
  const wins = reviewedSellTrades
    .map((trade) => trade.realizedPnl ?? 0)
    .filter((pnl) => pnl > 0);
  const losses = reviewedSellTrades
    .map((trade) => trade.realizedPnl ?? 0)
    .filter((pnl) => pnl < 0);

  return {
    completedPlans: buyTradesWithPlans.length,
    closedReviews: reviewedSellTrades.length,
    planFollowingRate: reviewedSellTrades.length === 0 ? 0 : Math.round((planFollowingCount / reviewedSellTrades.length) * 100),
    averageWin: wins.length === 0 ? 0 : wins.reduce((sum, pnl) => sum + pnl, 0) / wins.length,
    averageLoss: losses.length === 0 ? 0 : losses.reduce((sum, pnl) => sum + pnl, 0) / losses.length,
    commonMistake: getCommonMistake(reviewedSellTrades),
  };
}

function getCommonMistake(trades: Trade[]): MistakeType | null {
  const counts = new Map<MistakeType, number>();

  for (const trade of trades) {
    const mistakeType = trade.review?.mistakeType;
    if (mistakeType) {
      counts.set(mistakeType, (counts.get(mistakeType) ?? 0) + 1);
    }
  }

  let commonMistake: MistakeType | null = null;
  let highestCount = 0;
  counts.forEach((count, mistakeType) => {
    if (count > highestCount) {
      highestCount = count;
      commonMistake = mistakeType;
    }
  });

  return commonMistake;
}

export function formatMoneyForLearningLab(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}
```

- [ ] **Step 2: Replace duplicated constants and loading in page**

In `frontend/src/pages/LearningLab.tsx`, import helpers:

```ts
import {
  STARTING_CASH,
  calculateDashboardMetrics,
  calculatePortfolioValue,
  calculatePositionSize,
  calculateRealizedPnl,
  createDefaultLearningLabState,
  formatMoneyForLearningLab,
  isTradePlanComplete,
  migrateLearningLabState,
} from '../utils/learningLab';
```

Remove the local `STARTING_CASH`, `formatMoney`, and `createDefaultState`. Keep this local alias to minimize JSX churn:

```ts
const formatMoney = formatMoneyForLearningLab;
```

Update `loadState`:

```ts
function loadState(): SimulatorState {
  return migrateLearningLabState(localStorage.getItem(STORAGE_KEY));
}
```

Update the initial state:

```ts
const [state, setState] = useState<SimulatorState>(createDefaultLearningLabState());
```

Update `resetSimulator`:

```ts
const resetSimulator = () => {
  const next = createDefaultLearningLabState();
  setState(next);
  setActionMessage('Simulator reset. Start your next learning sprint.');
};
```

Update `portfolioValue`:

```ts
const portfolioValue = useMemo(
  () => calculatePortfolioValue(state.cash, state.positions),
  [state.cash, state.positions]
);
```

- [ ] **Step 3: Surface corrupt storage recovery message**

After initial load in `LearningLab.tsx`, add:

```ts
useEffect(() => {
  const initial = loadState();
  setState(initial);
  if (initial.recoveryMessage) {
    setActionMessage(initial.recoveryMessage);
  }
}, []);
```

Remove the older initial-load effect body so there is only one initial load effect.

- [ ] **Step 4: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/learningLab.ts frontend/src/pages/LearningLab.tsx
git commit -m "refactor: add learning lab calculation helpers"
```

---

### Task 3: Add Guided Trade Plan and Position Sizing

**Files:**
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Add form defaults and state**

In `LearningLab.tsx`, add these constants near `STORAGE_KEY`:

```ts
const createDefaultPlanForm = (): TradePlanForm => ({
  reasonForBuying: '',
  wrongSignal: '',
  reviewCondition: '',
  maxPracticeLoss: '1',
  maxPracticeLossType: 'percent',
  plannedWrongPrice: '',
});
```

Inside `LearningLab`, replace `reasonInput` state with:

```ts
const [planForm, setPlanForm] = useState<TradePlanForm>(createDefaultPlanForm());
```

Add derived values after `portfolioValue`:

```ts
const positionSize = useMemo(
  () => calculatePositionSize(planForm, watchPrice, portfolioValue),
  [planForm, portfolioValue, watchPrice]
);
const planComplete = isTradePlanComplete(planForm);
const requestedShares = Number(sharesInput);
const isOversizedTrade = positionSize.suggestedShares > 0 && requestedShares > positionSize.suggestedShares;
```

- [ ] **Step 2: Replace the reason textarea with beginner plan fields**

In the execution console JSX, replace the old `textarea` bound to `reasonInput` with:

```tsx
<div className="rounded-xl bg-gray-950/50 border border-cyan-400/20 p-4 space-y-4">
  <div>
    <h4 className="text-white font-semibold">Your practice plan</h4>
    <p className="text-sm text-gray-400 mt-1">
      Start with plain answers. The investing terms are shown after each prompt so you learn them by doing.
    </p>
  </div>

  <label className="block">
    <span className="text-sm text-gray-200">Why might this company become more valuable?</span>
    <span className="block text-xs text-cyan-300 mt-1">Investors call this your investment thesis.</span>
    <textarea
      value={planForm.reasonForBuying}
      onChange={(e) => setPlanForm((prev) => ({ ...prev, reasonForBuying: e.target.value }))}
      className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-20"
      placeholder="Example: Revenue is growing, debt is manageable, and the stock is cheaper than similar companies."
    />
  </label>

  <label className="block">
    <span className="text-sm text-gray-200">What would tell you your idea was wrong?</span>
    <span className="block text-xs text-cyan-300 mt-1">Investors call this an invalidation point.</span>
    <textarea
      value={planForm.wrongSignal}
      onChange={(e) => setPlanForm((prev) => ({ ...prev, wrongSignal: e.target.value }))}
      className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-16"
      placeholder="Example: Price falls below my wrong-price level or the company reports weaker earnings."
    />
  </label>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <label className="block md:col-span-1">
      <span className="text-sm text-gray-200">Your "I was wrong" price</span>
      <span className="block text-xs text-cyan-300 mt-1">Used for position sizing.</span>
      <input
        value={planForm.plannedWrongPrice}
        onChange={(e) => setPlanForm((prev) => ({ ...prev, plannedWrongPrice: e.target.value }))}
        type="number"
        min="0"
        step="0.01"
        className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
        placeholder="80.00"
      />
    </label>

    <label className="block md:col-span-1">
      <span className="text-sm text-gray-200">Max practice loss</span>
      <span className="block text-xs text-cyan-300 mt-1">How much you accept losing if wrong.</span>
      <input
        value={planForm.maxPracticeLoss}
        onChange={(e) => setPlanForm((prev) => ({ ...prev, maxPracticeLoss: e.target.value }))}
        type="number"
        min="0"
        step="0.01"
        className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
      />
    </label>

    <label className="block md:col-span-1">
      <span className="text-sm text-gray-200">Loss type</span>
      <span className="block text-xs text-cyan-300 mt-1">Amount or portfolio percent.</span>
      <select
        value={planForm.maxPracticeLossType}
        onChange={(e) => setPlanForm((prev) => ({ ...prev, maxPracticeLossType: e.target.value as TradePlanForm['maxPracticeLossType'] }))}
        className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
      >
        <option value="percent">% of portfolio</option>
        <option value="amount">Dollar amount</option>
      </select>
    </label>
  </div>

  <label className="block">
    <span className="text-sm text-gray-200">When will you check if this is working?</span>
    <span className="block text-xs text-cyan-300 mt-1">Investors call this a review condition.</span>
    <input
      value={planForm.reviewCondition}
      onChange={(e) => setPlanForm((prev) => ({ ...prev, reviewCondition: e.target.value }))}
      className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
      placeholder="Example: Review after 30 days or after the next earnings report."
    />
  </label>

  <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/20 p-3">
    <p className="text-sm text-cyan-100">{positionSize.explanation}</p>
    {isOversizedTrade && (
      <p className="text-sm text-amber-300 mt-2">
        Your share amount is larger than the suggested practice size. You can continue, but this is riskier than your plan.
      </p>
    )}
  </div>
</div>
```

- [ ] **Step 3: Enforce completed plan before buy**

At the start of `executeTrade`, after basic share validation, add:

```ts
if (type === 'BUY' && !planComplete) {
  setActionMessage('Complete the practice plan before buying. The goal is to learn the process, not just place trades.');
  return;
}
```

- [ ] **Step 4: Store a plan with buy trades and positions**

Inside the `type === 'BUY'` branch, before updating positions, create:

```ts
const plan: TradePlan = {
  id: `${Date.now()}-${Math.random()}-plan`,
  ticker: selectedTicker,
  reasonForBuying: planForm.reasonForBuying.trim(),
  wrongSignal: planForm.wrongSignal.trim(),
  reviewCondition: planForm.reviewCondition.trim(),
  maxPracticeLoss: Number(planForm.maxPracticeLoss),
  maxPracticeLossType: planForm.maxPracticeLossType,
  plannedEntryPrice: executionPrice,
  plannedWrongPrice: Number(planForm.plannedWrongPrice),
  suggestedShares: positionSize.suggestedShares,
  createdAt: new Date().toISOString(),
};
```

When creating or updating a position, include `planId: plan.id`.

When creating the buy trade, set:

```ts
reason: plan.reasonForBuying,
planId: plan.id,
```

In the returned state for a buy, add the plan:

```ts
plans: [plan, ...prev.plans],
```

After successful execution, reset the form:

```ts
if (type === 'BUY') {
  setPlanForm(createDefaultPlanForm());
}
```

- [ ] **Step 5: Disable buy button when plan is incomplete**

Change the Buy button props:

```tsx
disabled={!planComplete}
className={`px-4 py-2 rounded-lg text-white font-medium ${
  planComplete ? 'bg-emerald-500/80 hover:bg-emerald-500' : 'bg-gray-700 cursor-not-allowed opacity-60'
}`}
```

- [ ] **Step 6: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds and TypeScript accepts the `TradePlanForm['maxPracticeLossType']` cast.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/LearningLab.tsx
git commit -m "feat: add guided learning lab trade plans"
```

---

### Task 4: Add Sell Review and Realized P/L

**Files:**
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Add sell review form state**

Near `createDefaultPlanForm`, add:

```ts
const createDefaultSellReviewForm = (): SellReviewForm => ({
  outcome: 'unclear',
  followedPlan: true,
  lessonLearned: '',
  mistakeType: '',
});
```

Inside `LearningLab`, add:

```ts
const [sellReviewForm, setSellReviewForm] = useState<SellReviewForm>(createDefaultSellReviewForm());
```

- [ ] **Step 2: Add review UI before action buttons**

In the execution console, before the button row, add:

```tsx
<div className="rounded-xl bg-gray-950/50 border border-amber-400/20 p-4 space-y-3">
  <div>
    <h4 className="text-white font-semibold">Before selling: what happened?</h4>
    <p className="text-sm text-gray-400 mt-1">
      Selling records a review so the lab can teach from your decisions, not only from profit or loss.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <label className="block">
      <span className="text-sm text-gray-200">Did your original idea work?</span>
      <select
        value={sellReviewForm.outcome}
        onChange={(e) => setSellReviewForm((prev) => ({ ...prev, outcome: e.target.value as SellReviewForm['outcome'] }))}
        className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
      >
        <option value="worked">Worked</option>
        <option value="failed">Failed</option>
        <option value="unclear">Still unclear</option>
      </select>
    </label>

    <label className="block">
      <span className="text-sm text-gray-200">Did you follow your plan?</span>
      <select
        value={sellReviewForm.followedPlan ? 'yes' : 'no'}
        onChange={(e) => setSellReviewForm((prev) => ({ ...prev, followedPlan: e.target.value === 'yes' }))}
        className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
      >
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </label>

    <label className="block">
      <span className="text-sm text-gray-200">Mistake type, if any</span>
      <select
        value={sellReviewForm.mistakeType}
        onChange={(e) => setSellReviewForm((prev) => ({ ...prev, mistakeType: e.target.value as SellReviewForm['mistakeType'] }))}
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
    <span className="text-sm text-gray-200">What did you learn?</span>
    <textarea
      value={sellReviewForm.lessonLearned}
      onChange={(e) => setSellReviewForm((prev) => ({ ...prev, lessonLearned: e.target.value }))}
      className="mt-2 w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-16"
      placeholder="Example: I bought before I understood the risk, or the plan worked but the position was too large."
    />
  </label>
</div>
```

- [ ] **Step 3: Require review text before sell**

In `executeTrade`, after stock lookup and before execution price fetch, add:

```ts
if (type === 'SELL' && sellReviewForm.lessonLearned.trim().length === 0) {
  setActionMessage('Write one lesson learned before selling. This makes the paper trade useful practice.');
  return;
}
```

- [ ] **Step 4: Store review and realized P/L on sell trade**

Inside the sell branch, before changing positions, add:

```ts
const realizedPnl = calculateRealizedPnl(existing, shares, executionPrice);
const sellTradeId = `${Date.now()}-${Math.random()}`;
const review = {
  tradeId: sellTradeId,
  outcome: sellReviewForm.outcome,
  followedPlan: sellReviewForm.followedPlan,
  lessonLearned: sellReviewForm.lessonLearned.trim(),
  mistakeType: sellReviewForm.mistakeType || undefined,
  reviewedAt: new Date().toISOString(),
};
```

When creating the sell trade, use:

```ts
{
  id: sellTradeId,
  ticker: selectedTicker,
  type,
  shares,
  price: executionPrice,
  timestamp: new Date().toISOString(),
  reason: review.lessonLearned,
  planId: existing.planId,
  review,
  realizedPnl,
}
```

After successful execution, reset:

```ts
if (type === 'SELL') {
  setSellReviewForm(createDefaultSellReviewForm());
}
```

- [ ] **Step 5: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/LearningLab.tsx
git commit -m "feat: require learning lab sell reviews"
```

---

### Task 5: Add Position Coach and Learning Dashboard

**Files:**
- Modify: `frontend/src/pages/LearningLab.tsx`

- [ ] **Step 1: Add dashboard metrics and plan lookup**

After `totalPnl`, add:

```ts
const dashboardMetrics = useMemo(() => calculateDashboardMetrics(state.trades), [state.trades]);
const plansById = useMemo(
  () => new Map(state.plans.map((plan) => [plan.id, plan])),
  [state.plans]
);
```

- [ ] **Step 2: Replace the fourth summary card with process score**

Replace the existing `Trades Logged` card with:

```tsx
<div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
  <p className="text-gray-400 text-xs">Plan Following</p>
  <p className="text-xl text-white font-semibold">{dashboardMetrics.planFollowingRate}%</p>
</div>
```

- [ ] **Step 3: Add learning dashboard card**

Add this card in the right column above `Learning Missions`:

```tsx
<div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
  <h3 className="text-lg text-white font-semibold mb-3">Learning Dashboard</h3>
  <div className="grid grid-cols-2 gap-3 text-sm">
    <div className="rounded-lg bg-gray-800/70 p-3">
      <p className="text-gray-400">Completed plans</p>
      <p className="text-white text-lg font-semibold">{dashboardMetrics.completedPlans}</p>
    </div>
    <div className="rounded-lg bg-gray-800/70 p-3">
      <p className="text-gray-400">Closed reviews</p>
      <p className="text-white text-lg font-semibold">{dashboardMetrics.closedReviews}</p>
    </div>
    <div className="rounded-lg bg-gray-800/70 p-3">
      <p className="text-gray-400">Average win</p>
      <p className="text-emerald-400 text-lg font-semibold">{formatMoney(dashboardMetrics.averageWin)}</p>
    </div>
    <div className="rounded-lg bg-gray-800/70 p-3">
      <p className="text-gray-400">Average loss</p>
      <p className="text-red-400 text-lg font-semibold">{formatMoney(dashboardMetrics.averageLoss)}</p>
    </div>
  </div>
  <p className="text-xs text-gray-400 mt-3">
    Common mistake: {dashboardMetrics.commonMistake ? dashboardMetrics.commonMistake.replaceAll('_', ' ') : 'none recorded yet'}
  </p>
  <p className="text-xs text-gray-500 mt-2">
    This is practice feedback, not financial advice or a promise of future returns.
  </p>
</div>
```

- [ ] **Step 4: Enrich open positions with plan details**

Inside the `state.positions.map`, add:

```ts
const plan = position.planId ? plansById.get(position.planId) : undefined;
const plannedWrongPrice = plan?.plannedWrongPrice;
const withinPlannedRisk = plannedWrongPrice == null || position.currentPrice >= plannedWrongPrice;
```

Then replace the position card body with:

```tsx
<div key={position.ticker} className="bg-gray-800/70 border border-white/10 rounded-lg p-3">
  <div className="flex justify-between gap-4">
    <p className="text-white font-medium">{position.ticker} · {position.name}</p>
    <p className={unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatMoney(unrealized)}</p>
  </div>
  <p className="text-xs text-gray-400 mt-1">
    {position.shares} shares · Avg {formatMoney(position.avgCost)} · Last {formatMoney(position.currentPrice)}
  </p>
  {plan ? (
    <div className="mt-3 space-y-2 text-xs">
      <p className="text-gray-300"><span className="text-cyan-300">Reason:</span> {plan.reasonForBuying}</p>
      <p className="text-gray-300"><span className="text-cyan-300">Wrong signal:</span> {plan.wrongSignal}</p>
      <p className="text-gray-300"><span className="text-cyan-300">Review:</span> {plan.reviewCondition}</p>
      <p className={withinPlannedRisk ? 'text-emerald-300' : 'text-amber-300'}>
        {withinPlannedRisk ? 'Still inside the planned risk area.' : 'Price is beyond your planned wrong-price. Review the position.'}
      </p>
    </div>
  ) : (
    <p className="text-xs text-amber-300 mt-3">
      This is unplanned practice history from before the guided lab. Future trades should include a plan.
    </p>
  )}
</div>
```

- [ ] **Step 5: Update recent trades to show reviews**

Below the trade reason in recent trades, add:

```tsx
{trade.review && (
  <p className="text-xs text-cyan-300 mt-1">
    Review: idea {trade.review.outcome}, {trade.review.followedPlan ? 'followed plan' : 'did not follow plan'}
    {trade.realizedPnl != null ? ` · Realized ${formatMoney(trade.realizedPnl)}` : ''}
  </p>
)}
```

- [ ] **Step 6: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/LearningLab.tsx
git commit -m "feat: add learning lab process dashboard"
```

---

### Task 6: Update Missions, Copy, and Documentation

**Files:**
- Modify: `frontend/src/pages/LearningLab.tsx`
- Modify: `docs/features/LEARNING_MODE_PLAN.md`

- [ ] **Step 1: Update page intro copy**

In `LearningLab.tsx`, replace the intro paragraph with:

```tsx
Train with a live-data paper portfolio. The lab teaches plain-language investing decisions first, then introduces the market terms after you use them.
```

- [ ] **Step 2: Replace static missions with guided missions**

Replace the Learning Missions list with:

```tsx
<ul className="space-y-2 text-sm text-gray-300 list-disc pl-4">
  <li>Complete 3 buys with a written reason, wrong signal, review condition, and max practice loss.</li>
  <li>Keep each new position within the suggested practice size or write down why you accepted more risk.</li>
  <li>Close 3 positions with a sell review before judging your results.</li>
  <li>Find your most common mistake and write one process improvement in the journal.</li>
</ul>
```

- [ ] **Step 3: Update journal placeholder**

Replace the journal placeholder with:

```tsx
placeholder="What pattern do you notice in your decisions? What will you do differently in the next practice trade?"
```

- [ ] **Step 4: Add docs note**

Append this section to `docs/features/LEARNING_MODE_PLAN.md`:

```md
## Learning Lab Practical Loop

The Learning Lab is the practical application layer for Learning Mode. It teaches beginner investors through plain-language decisions before introducing jargon:

- "Why might this company become more valuable?" -> investment thesis
- "What would tell you your idea was wrong?" -> invalidation point
- "How much are you willing to lose if wrong?" -> risk per trade
- "How many shares keeps that loss small?" -> position sizing

The first implementation keeps data in localStorage and focuses on practice quality: completed plans, sell reviews, plan-following rate, average win/loss, and common mistake types.
```

- [ ] **Step 5: Run final frontend verification**

Run:

```bash
cd frontend
npm run build
```

Expected: `tsc && vite build` completes successfully.

- [ ] **Step 6: Manual verification**

Run:

```bash
cd frontend
npm run dev
```

Expected: Vite starts and prints a local URL.

In the browser, verify:

- The Learning Lab loads with old or empty localStorage.
- Buy is disabled until plan fields are complete.
- Position size guidance appears after max loss and wrong-price are filled.
- Buying creates a position with plan details.
- Selling requires a lesson learned.
- Recent trades show sell review and realized P/L.
- Reset clears positions, trades, plans, and journal.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/LearningLab.tsx docs/features/LEARNING_MODE_PLAN.md
git commit -m "docs: document learning lab practice loop"
```

---

## Final Verification

- [ ] Run `git status --short` and confirm only intentional files changed.
- [ ] Run `cd frontend && npm run build`.
- [ ] If manual browser verification was performed, record the result in the final response.
- [ ] If browser verification was not performed, state that only static build verification was completed.
