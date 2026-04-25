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
