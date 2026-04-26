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
              Your share amount is larger than the suggested practice size. You can continue, but this
              is riskier than your plan.
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
