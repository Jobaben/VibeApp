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
      cash: typeof parsed.cash === 'number' && Number.isFinite(parsed.cash) ? parsed.cash : STARTING_CASH,
      positions: Array.isArray(parsed.positions) ? parsed.positions.map(sanitizePosition).filter(isPosition) : [],
      trades: Array.isArray(parsed.trades) ? parsed.trades : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
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
  }).format(amount);
}
