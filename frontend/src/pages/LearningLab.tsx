import { useEffect, useMemo, useRef, useState } from 'react';
import { stockApi } from '../services/api';
import type { SellReviewForm, SimulatorState, TradePlan, TradePlanForm } from '../types/learningLab';
import type { LeaderboardStock } from '../types/stock';
import {
  STARTING_CASH,
  applyLearningLabBuyTrade,
  applyLearningLabSellTrade,
  calculateDashboardMetrics,
  calculatePositionSize,
  calculatePortfolioValue,
  calculateRealizedPnl,
  createDefaultLearningLabState,
  formatMoneyForLearningLab,
  isTradePlanComplete,
  migrateLearningLabState,
  updateLearningLabJournal,
} from '../utils/learningLab';

const STORAGE_KEY = 'learning-lab-simulator-v1';
const createDefaultPlanForm = (): TradePlanForm => ({
  reasonForBuying: '',
  wrongSignal: '',
  reviewCondition: '',
  maxPracticeLoss: '1',
  maxPracticeLossType: 'percent',
  plannedWrongPrice: '',
});
const createDefaultSellReviewForm = (): SellReviewForm => ({
  outcome: 'unclear',
  followedPlan: true,
  lessonLearned: '',
  mistakeType: '',
});
const formatMoney = formatMoneyForLearningLab;

function areTradePlanFormsEqual(left: TradePlanForm, right: TradePlanForm): boolean {
  return (
    left.reasonForBuying === right.reasonForBuying &&
    left.wrongSignal === right.wrongSignal &&
    left.reviewCondition === right.reviewCondition &&
    left.maxPracticeLoss === right.maxPracticeLoss &&
    left.maxPracticeLossType === right.maxPracticeLossType &&
    left.plannedWrongPrice === right.plannedWrongPrice
  );
}

function loadState(): SimulatorState {
  return migrateLearningLabState(localStorage.getItem(STORAGE_KEY));
}

export default function LearningLab() {
  const [marketIdeas, setMarketIdeas] = useState<LeaderboardStock[]>([]);
  const [state, setState] = useState<SimulatorState>(() => loadState());
  const [selectedTicker, setSelectedTicker] = useState('');
  const [sharesInput, setSharesInput] = useState('10');
  const [planForm, setPlanForm] = useState<TradePlanForm>(createDefaultPlanForm());
  const [sellReviewForm, setSellReviewForm] = useState<SellReviewForm>(createDefaultSellReviewForm());
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const stateRef = useRef(state);
  const isExecutingTradeRef = useRef(false);

  const commitSimulatorState = (nextState: SimulatorState) => {
    stateRef.current = nextState;
    setState(nextState);
  };

  useEffect(() => {
    if (stateRef.current.recoveryMessage) {
      setActionMessage(stateRef.current.recoveryMessage);
    }
  }, []);

  useEffect(() => {
    stateRef.current = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let mounted = true;

    async function fetchIdeas() {
      try {
        setLoadingIdeas(true);
        const leaderboard = await stockApi.getLeaderboard(30);
        if (mounted) {
          setMarketIdeas(leaderboard);
          if (!selectedTicker && leaderboard.length > 0) {
            setSelectedTicker(leaderboard[0].ticker);
          }
        }
      } catch {
        if (mounted) {
          setActionMessage('Could not load ideas from leaderboard. Try again later.');
        }
      } finally {
        if (mounted) {
          setLoadingIdeas(false);
        }
      }
    }

    fetchIdeas();

    return () => {
      mounted = false;
    };
  }, []);

  const watchPrice = useMemo(() => {
    const selectedPosition = state.positions.find((p) => p.ticker === selectedTicker);
    if (selectedPosition) {
      return selectedPosition.currentPrice;
    }

    const inIdeas = marketIdeas.find((stock) => stock.ticker === selectedTicker);
    if (!inIdeas) {
      return 0;
    }

    // Use score as a rough confidence number when price isn't loaded yet.
    return Math.max(1, inIdeas.total_score);
  }, [marketIdeas, selectedTicker, state.positions]);

  const portfolioValue = useMemo(
    () => calculatePortfolioValue(state.cash, state.positions),
    [state.cash, state.positions]
  );
  const positionSize = useMemo(
    () => calculatePositionSize(planForm, watchPrice, portfolioValue),
    [planForm, portfolioValue, watchPrice]
  );
  const planComplete = isTradePlanComplete(planForm);
  const canBuy = planComplete && positionSize.suggestedShares > 0;
  const requestedShares = Number(sharesInput);
  const isOversizedTrade = positionSize.suggestedShares > 0 && requestedShares > positionSize.suggestedShares;
  const totalPnl = portfolioValue - STARTING_CASH;
  const dashboardMetrics = useMemo(() => calculateDashboardMetrics(state.trades), [state.trades]);
  const plansById = useMemo(
    () => new Map(state.plans.map((plan) => [plan.id, plan])),
    [state.plans]
  );

  const refreshPositionPrices = async () => {
    if (isExecutingTradeRef.current) {
      setActionMessage('Wait for the current practice order to finish before refreshing prices.');
      return;
    }

    if (stateRef.current.positions.length === 0) {
      return;
    }

    const positionsToRefresh = stateRef.current.positions;
    const updatedPrices = new Map<string, number>();

    await Promise.all(
      positionsToRefresh.map(async (position) => {
        try {
          const historical = await stockApi.getHistoricalPrices(position.ticker, '1mo', false);
          const latest = historical.data[historical.data.length - 1];
          if (latest?.close) {
            updatedPrices.set(position.ticker, latest.close);
          }
        } catch {
          // Keep the existing price when a refresh fails for one ticker.
        }
      })
    );

    if (isExecutingTradeRef.current) {
      setActionMessage('Wait for the current practice order to finish before refreshing prices.');
      return;
    }

    commitSimulatorState({
      ...stateRef.current,
      positions: stateRef.current.positions.map((position) =>
        updatedPrices.has(position.ticker)
          ? { ...position, currentPrice: updatedPrices.get(position.ticker)! }
          : position
      ),
    });
    setActionMessage('Portfolio prices refreshed from market data.');
  };

  const executeTrade = async (type: 'BUY' | 'SELL') => {
    if (isExecutingTrade || isExecutingTradeRef.current) {
      setActionMessage('A practice order is already being processed.');
      return;
    }

    const shares = Number(sharesInput);
    const submittedPlanForm = planForm;
    const submittedSellReviewForm = sellReviewForm;
    if (!selectedTicker || !Number.isFinite(shares) || shares <= 0) {
      setActionMessage('Pick a ticker and valid share amount.');
      return;
    }

    if (type === 'BUY' && !isTradePlanComplete(submittedPlanForm)) {
      setActionMessage('Complete the practice plan before buying. The goal is to learn the process, not just place trades.');
      return;
    }

    const submittedPositionSize = calculatePositionSize(submittedPlanForm, watchPrice, portfolioValue);
    if (type === 'BUY' && submittedPositionSize.suggestedShares <= 0) {
      setActionMessage('Adjust the plan so the app can estimate a safer practice size before buying.');
      return;
    }

    const stock = marketIdeas.find((item) => item.ticker === selectedTicker);
    if (!stock) {
      setActionMessage('Ticker not available right now.');
      return;
    }

    if (type === 'SELL' && submittedSellReviewForm.lessonLearned.trim().length === 0) {
      setActionMessage('Write one lesson learned before selling. This makes the paper trade useful practice.');
      return;
    }

    isExecutingTradeRef.current = true;
    setIsExecutingTrade(true);

    try {
      let executionPrice = watchPrice;
      try {
        const historical = await stockApi.getHistoricalPrices(selectedTicker, '1mo', false);
        const latest = historical.data[historical.data.length - 1];
        if (latest?.close) {
          executionPrice = latest.close;
        }
      } catch {
        // fallback to score-based synthetic price in demo mode
      }

      const tradeValue = shares * executionPrice;
      const executionPositionSize = calculatePositionSize(submittedPlanForm, executionPrice, portfolioValue);

      if (type === 'BUY' && executionPositionSize.suggestedShares <= 0) {
        setActionMessage('Adjust the plan so the app can estimate a safer practice size before buying.');
        return;
      }

      const timestamp = new Date().toISOString();
      const tradeId = `${Date.now()}-${Math.random()}`;

      if (type === 'BUY') {
        const plan: TradePlan = {
          id: `${Date.now()}-${Math.random()}-plan`,
          ticker: selectedTicker,
          reasonForBuying: submittedPlanForm.reasonForBuying.trim(),
          wrongSignal: submittedPlanForm.wrongSignal.trim(),
          reviewCondition: submittedPlanForm.reviewCondition.trim(),
          maxPracticeLoss: Number(submittedPlanForm.maxPracticeLoss),
          maxPracticeLossType: submittedPlanForm.maxPracticeLossType,
          plannedEntryPrice: executionPrice,
          plannedWrongPrice: Number(submittedPlanForm.plannedWrongPrice),
          suggestedShares: executionPositionSize.suggestedShares,
          createdAt: new Date().toISOString(),
        };
        const trade = {
          id: tradeId,
          ticker: selectedTicker,
          type,
          shares,
          price: executionPrice,
          timestamp,
          reason: plan.reasonForBuying,
          planId: plan.id,
        };

        const result = applyLearningLabBuyTrade(stateRef.current, {
          selectedTicker,
          stockName: stock.name,
          shares,
          tradeValue,
          executionPrice,
          plan,
          trade,
        });
        if (!result.applied) {
          setActionMessage('Not enough cash. Reduce size or sell another position.');
          return;
        }

        commitSimulatorState(result.state);
        setPlanForm((current) =>
          areTradePlanFormsEqual(current, submittedPlanForm) ? createDefaultPlanForm() : current
        );
        setActionMessage(`${type} order filled: ${shares} ${selectedTicker} @ ${formatMoney(executionPrice)}.`);
        return;
      }

      const latestExistingPosition = stateRef.current.positions.find((p) => p.ticker === selectedTicker);
      if (!latestExistingPosition || latestExistingPosition.shares < shares) {
        setActionMessage('You cannot sell more shares than you own.');
        return;
      }

      const realizedPnl = calculateRealizedPnl(latestExistingPosition, shares, executionPrice);
      const sellTradeId = tradeId;
      const review = {
        tradeId: sellTradeId,
        outcome: submittedSellReviewForm.outcome,
        followedPlan: submittedSellReviewForm.followedPlan,
        lessonLearned: submittedSellReviewForm.lessonLearned.trim(),
        mistakeType: submittedSellReviewForm.mistakeType || undefined,
        reviewedAt: timestamp,
      };
      const trade = {
        id: sellTradeId,
        ticker: selectedTicker,
        type,
        shares,
        price: executionPrice,
        timestamp,
        reason: review.lessonLearned,
        planId: latestExistingPosition.planId,
        review,
        realizedPnl,
      };

      const result = applyLearningLabSellTrade(stateRef.current, {
        selectedTicker,
        shares,
        tradeValue,
        executionPrice,
        trade,
      });
      if (!result.applied) {
        setActionMessage('You cannot sell more shares than you own.');
        return;
      }

      commitSimulatorState(result.state);
      setSellReviewForm(createDefaultSellReviewForm());
      setActionMessage(`${type} order filled: ${shares} ${selectedTicker} @ ${formatMoney(executionPrice)}.`);
    } finally {
      isExecutingTradeRef.current = false;
      setIsExecutingTrade(false);
    }
  };

  const resetSimulator = () => {
    if (isExecutingTradeRef.current) {
      setActionMessage('Wait for the current practice order to finish before resetting the simulator.');
      return;
    }

    const next = createDefaultLearningLabState();
    commitSimulatorState(next);
    setActionMessage('Simulator reset. Start your next learning sprint.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
        <h2 className="text-2xl font-bold text-white">Learning Lab: Learn by Doing</h2>
        <p className="text-gray-300 mt-2">
          Train with a live-data paper portfolio. The lab teaches plain-language investing decisions first, then introduces the market terms after you use them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Cash</p>
          <p className="text-xl text-white font-semibold">{formatMoney(state.cash)}</p>
        </div>
        <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Portfolio Value</p>
          <p className="text-xl text-white font-semibold">{formatMoney(portfolioValue)}</p>
        </div>
        <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Total P/L</p>
          <p className={`text-xl font-semibold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatMoney(totalPnl)}
          </p>
        </div>
        <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
          <p className="text-gray-400 text-xs">Plan Following</p>
          <p className="text-xl text-white font-semibold">{dashboardMetrics.planFollowingRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4 space-y-4">
            <h3 className="text-lg text-white font-semibold">Execution Console</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
              >
                {loadingIdeas ? (
                  <option>Loading...</option>
                ) : (
                  marketIdeas.map((idea) => (
                    <option key={idea.ticker} value={idea.ticker}>
                      {idea.ticker} · {idea.name}
                    </option>
                  ))
                )}
              </select>
              <input
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
                type="number"
                min="1"
                className="bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2"
                placeholder="Shares"
              />
              <div className="bg-gray-800 text-cyan-300 border border-white/10 rounded-lg px-3 py-2 flex items-center">
                Est. price: {formatMoney(watchPrice || 0)}
              </div>
            </div>
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => executeTrade('BUY')}
                disabled={!canBuy || isExecutingTrade}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  canBuy && !isExecutingTrade ? 'bg-emerald-500/80 hover:bg-emerald-500' : 'bg-gray-700 cursor-not-allowed opacity-60'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => executeTrade('SELL')}
                disabled={isExecutingTrade}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  isExecutingTrade ? 'bg-gray-700 cursor-not-allowed opacity-60' : 'bg-red-500/80 hover:bg-red-500'
                }`}
              >
                Sell
              </button>
              <button
                type="button"
                onClick={refreshPositionPrices}
                disabled={isExecutingTrade}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  isExecutingTrade ? 'bg-gray-700 cursor-not-allowed opacity-60' : 'bg-cyan-500/80 hover:bg-cyan-500'
                }`}
              >
                Refresh Prices
              </button>
              <button
                type="button"
                onClick={resetSimulator}
                disabled={isExecutingTrade}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  isExecutingTrade ? 'bg-gray-700 cursor-not-allowed opacity-60' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Reset
              </button>
            </div>
            {actionMessage && <p className="text-sm text-cyan-300">{actionMessage}</p>}
          </div>

          <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
            <h3 className="text-lg text-white font-semibold mb-3">Open Positions</h3>
            {state.positions.length === 0 ? (
              <p className="text-gray-400">No positions yet. Start by placing your first trade.</p>
            ) : (
              <div className="space-y-2">
                {state.positions.map((position) => {
                  const unrealized = (position.currentPrice - position.avgCost) * position.shares;
                  const plan = position.planId ? plansById.get(position.planId) : undefined;
                  const plannedWrongPrice = plan?.plannedWrongPrice;
                  const withinPlannedRisk = plannedWrongPrice == null || position.currentPrice >= plannedWrongPrice;
                  return (
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
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
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
              Common mistake: {dashboardMetrics.commonMistake ? dashboardMetrics.commonMistake.replace(/_/g, ' ') : 'none recorded yet'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This is practice feedback, not financial advice or a promise of future returns.
            </p>
          </div>

          <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
            <h3 className="text-lg text-white font-semibold mb-2">Learning Missions</h3>
            <ul className="space-y-2 text-sm text-gray-300 list-disc pl-4">
              <li>Complete 3 buys with a written reason, wrong signal, review condition, and max practice loss.</li>
              <li>Keep each new position within the suggested practice size or write down why you accepted more risk.</li>
              <li>Close 3 positions with a sell review before judging your results.</li>
              <li>Find your most common mistake and write one process improvement in the journal.</li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
            <h3 className="text-lg text-white font-semibold mb-2">Trading Journal</h3>
            <textarea
              value={state.journal}
              onChange={(e) => commitSimulatorState(updateLearningLabJournal(stateRef.current, e.target.value))}
              className="w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-40"
              placeholder="What pattern do you notice in your decisions? What will you do differently in the next practice trade?"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
        <h3 className="text-lg text-white font-semibold mb-3">Recent Trades</h3>
        {state.trades.length === 0 ? (
          <p className="text-gray-400">No trades logged yet.</p>
        ) : (
          <div className="space-y-2">
            {state.trades.slice(0, 10).map((trade) => (
              <div key={trade.id} className="bg-gray-800/70 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm">
                    <span className={trade.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>{trade.type}</span> {trade.shares} {trade.ticker} @ {formatMoney(trade.price)}
                  </p>
                  <p className="text-gray-400 text-xs">{new Date(trade.timestamp).toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-300 mt-1">Reason: {trade.reason}</p>
                {trade.review && (
                  <p className="text-xs text-cyan-300 mt-1">
                    Review: idea {trade.review.outcome}, {trade.review.followedPlan ? 'followed plan' : 'did not follow plan'}
                    {trade.realizedPnl != null ? ` · Realized ${formatMoney(trade.realizedPnl)}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
