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
