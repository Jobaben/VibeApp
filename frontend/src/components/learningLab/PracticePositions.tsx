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
