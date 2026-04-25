import type {
  LearningDashboardMetrics,
  MistakeType,
  Position,
  PositionSizeResult,
  TradePlan,
  TradeReview,
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
      cash: typeof parsed.cash === 'number' && Number.isFinite(parsed.cash) ? parsed.cash : STARTING_CASH,
      positions: Array.isArray(parsed.positions) ? parsed.positions.map(sanitizePosition).filter(isPosition) : [],
      trades: Array.isArray(parsed.trades) ? parsed.trades.map(sanitizeTrade).filter(isTrade) : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans.map(sanitizeTradePlan).filter(isTradePlan) : [],
      journal: typeof parsed.journal === 'string' ? parsed.journal : '',
    };
  } catch {
    return createDefaultLearningLabState('We reset the simulator because saved practice data was unreadable.');
  }
}

export function calculatePortfolioValue(cash: number, positions: Position[]): number {
  const usableCash = Number.isFinite(cash) ? cash : 0;
  return (
    usableCash +
    positions.reduce((sum, position) => {
      if (!hasValidPositionFields(position)) {
        return sum;
      }

      return sum + position.shares * position.currentPrice;
    }, 0)
  );
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

  if (form.maxPracticeLossType === 'percent' && (!Number.isFinite(portfolioValue) || portfolioValue <= 0)) {
    return {
      suggestedShares: 0,
      plannedLossPerShare: 0,
      maxLossAmount: 0,
      explanation: 'Portfolio value is unavailable, so position size cannot be estimated yet.',
      missingReason: 'missing_portfolio_value',
    };
  }

  const maxLossAmount =
    form.maxPracticeLossType === 'percent' ? portfolioValue * (maxPracticeLoss / 100) : maxPracticeLoss;
  const plannedLossPerShare = entryPrice - plannedWrongPrice;
  const rawSuggestedShares = Math.floor(maxLossAmount / plannedLossPerShare);

  if (
    !Number.isFinite(maxLossAmount) ||
    maxLossAmount <= 0 ||
    !Number.isFinite(plannedLossPerShare) ||
    plannedLossPerShare <= 0 ||
    !Number.isFinite(rawSuggestedShares)
  ) {
    return {
      suggestedShares: 0,
      plannedLossPerShare: 0,
      maxLossAmount: 0,
      explanation: 'Position size cannot be estimated from the current risk inputs.',
      missingReason: 'missing_max_loss',
    };
  }

  const suggestedShares = Math.max(0, rawSuggestedShares);

  return {
    suggestedShares,
    plannedLossPerShare,
    maxLossAmount,
    explanation: `If the idea is wrong at ${formatMoneyForLearningLab(plannedWrongPrice)}, each share risks about ${formatMoneyForLearningLab(plannedLossPerShare)}. To keep the planned loss near ${formatMoneyForLearningLab(maxLossAmount)}, practice with up to ${suggestedShares} shares.`,
  };
}

export function isTradePlanComplete(form: TradePlanForm): boolean {
  const maxPracticeLoss = Number(form.maxPracticeLoss);
  const plannedWrongPrice = Number(form.plannedWrongPrice);

  return (
    form.reasonForBuying.trim().length > 0 &&
    form.wrongSignal.trim().length > 0 &&
    form.reviewCondition.trim().length > 0 &&
    Number.isFinite(maxPracticeLoss) &&
    maxPracticeLoss > 0 &&
    Number.isFinite(plannedWrongPrice) &&
    plannedWrongPrice > 0
  );
}

export function calculateRealizedPnl(position: Position, sharesSold: number, sellPrice: number): number {
  return (sellPrice - position.avgCost) * sharesSold;
}

interface ApplyLearningLabBuyTradeInput {
  selectedTicker: string;
  stockName: string;
  shares: number;
  tradeValue: number;
  executionPrice: number;
  plan: TradePlan;
  trade: Trade;
}

interface ApplyLearningLabSellTradeInput {
  selectedTicker: string;
  shares: number;
  tradeValue: number;
  executionPrice: number;
  trade: Trade;
}

interface LearningLabTradeApplicationResult {
  state: SimulatorState;
  applied: boolean;
}

export function applyLearningLabBuyTrade(
  state: SimulatorState,
  input: ApplyLearningLabBuyTradeInput
): LearningLabTradeApplicationResult {
  if (input.tradeValue > state.cash) {
    return { state, applied: false };
  }

  const positions = [...state.positions];
  const existingIndex = positions.findIndex((p) => p.ticker === input.selectedTicker);
  const existing = existingIndex >= 0 ? positions[existingIndex] : undefined;

  if (existing) {
    const totalShares = existing.shares + input.shares;
    const newAvgCost = (existing.avgCost * existing.shares + input.executionPrice * input.shares) / totalShares;
    positions[existingIndex] = {
      ...existing,
      shares: totalShares,
      avgCost: newAvgCost,
      currentPrice: input.executionPrice,
      planId: input.plan.id,
    };
  } else {
    positions.push({
      ticker: input.selectedTicker,
      name: input.stockName,
      shares: input.shares,
      avgCost: input.executionPrice,
      currentPrice: input.executionPrice,
      planId: input.plan.id,
    });
  }

  return {
    state: {
      ...state,
      cash: state.cash - input.tradeValue,
      positions,
      trades: [input.trade, ...state.trades],
      plans: [input.plan, ...state.plans],
    },
    applied: true,
  };
}

export function applyLearningLabSellTrade(
  state: SimulatorState,
  input: ApplyLearningLabSellTradeInput
): LearningLabTradeApplicationResult {
  const positions = [...state.positions];
  const existingIndex = positions.findIndex((p) => p.ticker === input.selectedTicker);
  const existing = existingIndex >= 0 ? positions[existingIndex] : undefined;

  if (!existing || existing.shares < input.shares) {
    return { state, applied: false };
  }

  const remainingShares = existing.shares - input.shares;
  if (remainingShares === 0) {
    positions.splice(existingIndex, 1);
  } else {
    positions[existingIndex] = { ...existing, shares: remainingShares, currentPrice: input.executionPrice };
  }

  return {
    state: {
      ...state,
      cash: state.cash + input.tradeValue,
      positions,
      trades: [input.trade, ...state.trades],
    },
    applied: true,
  };
}

export function updateLearningLabJournal(state: SimulatorState, journal: string): SimulatorState {
  return {
    ...state,
    journal,
  };
}

export function calculateDashboardMetrics(trades: Trade[]): LearningDashboardMetrics {
  const buyTradesWithPlans = trades.filter((trade) => trade.type === 'BUY' && trade.planId);
  const reviewedSellTrades = trades.filter((trade) => trade.type === 'SELL' && trade.review);
  const planFollowingCount = reviewedSellTrades.filter((trade) => trade.review?.followedPlan).length;
  const wins = reviewedSellTrades.map((trade) => trade.realizedPnl ?? 0).filter((pnl) => pnl > 0);
  const losses = reviewedSellTrades.map((trade) => trade.realizedPnl ?? 0).filter((pnl) => pnl < 0);

  return {
    completedPlans: buyTradesWithPlans.length,
    closedReviews: reviewedSellTrades.length,
    planFollowingRate:
      reviewedSellTrades.length === 0 ? 0 : Math.round((planFollowingCount / reviewedSellTrades.length) * 100),
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

function sanitizePosition(position: unknown): Position | null {
  if (!hasValidPositionFields(position)) {
    return null;
  }

  const candidate = position;
  const sanitized: Position = {
    ticker: candidate.ticker,
    name: candidate.name,
    shares: candidate.shares,
    avgCost: candidate.avgCost,
    currentPrice: candidate.currentPrice,
  };

  if (typeof candidate.planId === 'string') {
    sanitized.planId = candidate.planId;
  }

  return sanitized;
}

function isPosition(position: Position | null): position is Position {
  return position !== null;
}

function sanitizeTradePlan(plan: unknown): TradePlan | null {
  if (!plan || typeof plan !== 'object') {
    return null;
  }

  const candidate = plan as Partial<TradePlan>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.ticker !== 'string' ||
    typeof candidate.reasonForBuying !== 'string' ||
    typeof candidate.wrongSignal !== 'string' ||
    typeof candidate.reviewCondition !== 'string' ||
    typeof candidate.maxPracticeLoss !== 'number' ||
    !Number.isFinite(candidate.maxPracticeLoss) ||
    candidate.maxPracticeLoss <= 0 ||
    !isMaxPracticeLossType(candidate.maxPracticeLossType) ||
    typeof candidate.plannedEntryPrice !== 'number' ||
    !Number.isFinite(candidate.plannedEntryPrice) ||
    candidate.plannedEntryPrice <= 0 ||
    typeof candidate.createdAt !== 'string'
  ) {
    return null;
  }

  const sanitized: TradePlan = {
    id: candidate.id,
    ticker: candidate.ticker,
    reasonForBuying: candidate.reasonForBuying,
    wrongSignal: candidate.wrongSignal,
    reviewCondition: candidate.reviewCondition,
    maxPracticeLoss: candidate.maxPracticeLoss,
    maxPracticeLossType: candidate.maxPracticeLossType,
    plannedEntryPrice: candidate.plannedEntryPrice,
    createdAt: candidate.createdAt,
  };

  if (
    typeof candidate.plannedWrongPrice === 'number' &&
    Number.isFinite(candidate.plannedWrongPrice) &&
    candidate.plannedWrongPrice > 0
  ) {
    sanitized.plannedWrongPrice = candidate.plannedWrongPrice;
  }

  if (
    typeof candidate.suggestedShares === 'number' &&
    Number.isFinite(candidate.suggestedShares) &&
    candidate.suggestedShares > 0
  ) {
    sanitized.suggestedShares = candidate.suggestedShares;
  }

  return sanitized;
}

function isTradePlan(plan: TradePlan | null): plan is TradePlan {
  return plan !== null;
}

function sanitizeTrade(trade: unknown): Trade | null {
  if (!trade || typeof trade !== 'object') {
    return null;
  }

  const candidate = trade as Partial<Trade>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.ticker !== 'string' ||
    !isTradeType(candidate.type) ||
    typeof candidate.shares !== 'number' ||
    !Number.isFinite(candidate.shares) ||
    candidate.shares <= 0 ||
    typeof candidate.price !== 'number' ||
    !Number.isFinite(candidate.price) ||
    candidate.price < 0 ||
    typeof candidate.timestamp !== 'string' ||
    typeof candidate.reason !== 'string'
  ) {
    return null;
  }

  const sanitized: Trade = {
    id: candidate.id,
    ticker: candidate.ticker,
    type: candidate.type,
    shares: candidate.shares,
    price: candidate.price,
    timestamp: candidate.timestamp,
    reason: candidate.reason,
  };

  if (typeof candidate.planId === 'string') {
    sanitized.planId = candidate.planId;
  }

  if (typeof candidate.realizedPnl === 'number' && Number.isFinite(candidate.realizedPnl)) {
    sanitized.realizedPnl = candidate.realizedPnl;
  }

  const review = sanitizeTradeReview(candidate.review);
  if (review) {
    sanitized.review = review;
  }

  return sanitized;
}

function isTrade(trade: Trade | null): trade is Trade {
  return trade !== null;
}

function sanitizeTradeReview(review: unknown): TradeReview | null {
  if (!review || typeof review !== 'object') {
    return null;
  }

  const candidate = review as Partial<TradeReview>;
  if (
    typeof candidate.tradeId !== 'string' ||
    !isTradeOutcome(candidate.outcome) ||
    typeof candidate.followedPlan !== 'boolean' ||
    typeof candidate.lessonLearned !== 'string' ||
    typeof candidate.reviewedAt !== 'string'
  ) {
    return null;
  }

  const sanitized: TradeReview = {
    tradeId: candidate.tradeId,
    outcome: candidate.outcome,
    followedPlan: candidate.followedPlan,
    lessonLearned: candidate.lessonLearned,
    reviewedAt: candidate.reviewedAt,
  };

  if (isMistakeType(candidate.mistakeType)) {
    sanitized.mistakeType = candidate.mistakeType;
  }

  return sanitized;
}

function isMaxPracticeLossType(value: unknown): value is TradePlan['maxPracticeLossType'] {
  return value === 'amount' || value === 'percent';
}

function isTradeType(value: unknown): value is Trade['type'] {
  return value === 'BUY' || value === 'SELL';
}

function isTradeOutcome(value: unknown): value is TradeReview['outcome'] {
  return value === 'worked' || value === 'failed' || value === 'unclear';
}

function isMistakeType(value: unknown): value is MistakeType {
  return (
    value === 'no_reason' ||
    value === 'too_large' ||
    value === 'ignored_warning' ||
    value === 'emotional_sell' ||
    value === 'score_only' ||
    value === 'other'
  );
}

function hasValidPositionFields(position: unknown): position is Position {
  if (!position || typeof position !== 'object') {
    return false;
  }

  const candidate = position as Partial<Position>;

  return (
    typeof candidate.ticker === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.shares === 'number' &&
    Number.isFinite(candidate.shares) &&
    candidate.shares > 0 &&
    typeof candidate.avgCost === 'number' &&
    Number.isFinite(candidate.avgCost) &&
    candidate.avgCost >= 0 &&
    typeof candidate.currentPrice === 'number' &&
    Number.isFinite(candidate.currentPrice) &&
    candidate.currentPrice >= 0
  );
}

export function formatMoneyForLearningLab(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}
