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
            onChange={(e) =>
              update({ mistakeType: e.target.value as SellReviewForm['mistakeType'] })
            }
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
