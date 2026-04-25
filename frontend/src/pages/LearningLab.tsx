import { useEffect, useMemo, useRef, useState } from 'react';
import { stockApi } from '../services/api';
import type { SimulatorState, TradePlan, TradePlanForm } from '../types/learningLab';
import type { LeaderboardStock } from '../types/stock';
import {
  STARTING_CASH,
  calculatePositionSize,
  calculatePortfolioValue,
  createDefaultLearningLabState,
  formatMoneyForLearningLab,
  isTradePlanComplete,
  migrateLearningLabState,
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
  const [state, setState] = useState<SimulatorState>(createDefaultLearningLabState());
  const [selectedTicker, setSelectedTicker] = useState('');
  const [sharesInput, setSharesInput] = useState('10');
  const [planForm, setPlanForm] = useState<TradePlanForm>(createDefaultPlanForm());
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const stateRef = useRef(state);
  const isExecutingTradeRef = useRef(false);

  useEffect(() => {
    const initial = loadState();
    stateRef.current = initial;
    setState(initial);
    if (initial.recoveryMessage) {
      setActionMessage(initial.recoveryMessage);
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

  const refreshPositionPrices = async () => {
    if (state.positions.length === 0) {
      return;
    }

    const positionsToRefresh = state.positions;
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

    setState((prev) => ({
      ...prev,
      positions: prev.positions.map((position) =>
        updatedPrices.has(position.ticker)
          ? { ...position, currentPrice: updatedPrices.get(position.ticker)! }
          : position
      ),
    }));
    setActionMessage('Portfolio prices refreshed from market data.');
  };

  const executeTrade = async (type: 'BUY' | 'SELL') => {
    if (isExecutingTrade || isExecutingTradeRef.current) {
      setActionMessage('A practice order is already being processed.');
      return;
    }

    const shares = Number(sharesInput);
    const submittedPlanForm = planForm;
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

      const latestState = stateRef.current;
      const timestamp = new Date().toISOString();
      const tradeId = `${Date.now()}-${Math.random()}`;

      if (type === 'BUY') {
        if (tradeValue > latestState.cash) {
          setActionMessage('Not enough cash. Reduce size or sell another position.');
          return;
        }

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

        setState((prev) => {
          const positions = [...prev.positions];
          const existingIndex = positions.findIndex((p) => p.ticker === selectedTicker);
          const existing = existingIndex >= 0 ? positions[existingIndex] : undefined;

          if (existing) {
            const totalShares = existing.shares + shares;
            const newAvgCost = (existing.avgCost * existing.shares + executionPrice * shares) / totalShares;
            positions[existingIndex] = {
              ...existing,
              shares: totalShares,
              avgCost: newAvgCost,
              currentPrice: executionPrice,
              planId: plan.id,
            };
          } else {
            positions.push({
              ticker: selectedTicker,
              name: stock.name,
              shares,
              avgCost: executionPrice,
              currentPrice: executionPrice,
              planId: plan.id,
            });
          }

          return {
            ...prev,
            cash: prev.cash - tradeValue,
            positions,
            trades: [trade, ...prev.trades],
            plans: [plan, ...prev.plans],
          };
        });
        setPlanForm((current) =>
          areTradePlanFormsEqual(current, submittedPlanForm) ? createDefaultPlanForm() : current
        );
        setActionMessage(`${type} order filled: ${shares} ${selectedTicker} @ ${formatMoney(executionPrice)}.`);
        return;
      }

      const latestExistingPosition = latestState.positions.find((p) => p.ticker === selectedTicker);
      if (!latestExistingPosition || latestExistingPosition.shares < shares) {
        setActionMessage('You cannot sell more shares than you own.');
        return;
      }

      const trade = {
        id: tradeId,
        ticker: selectedTicker,
        type,
        shares,
        price: executionPrice,
        timestamp,
        reason: 'Sell order',
      };

      setState((prev) => {
        const positions = [...prev.positions];
        const existingIndex = positions.findIndex((p) => p.ticker === selectedTicker);
        const existing = positions[existingIndex];

        const remainingShares = existing.shares - shares;
        if (remainingShares === 0) {
          positions.splice(existingIndex, 1);
        } else {
          positions[existingIndex] = { ...existing, shares: remainingShares, currentPrice: executionPrice };
        }

        return {
          ...prev,
          cash: prev.cash + tradeValue,
          positions,
          trades: [trade, ...prev.trades],
        };
      });
      setActionMessage(`${type} order filled: ${shares} ${selectedTicker} @ ${formatMoney(executionPrice)}.`);
    } finally {
      isExecutingTradeRef.current = false;
      setIsExecutingTrade(false);
    }
  };

  const resetSimulator = () => {
    const next = createDefaultLearningLabState();
    setState(next);
    setActionMessage('Simulator reset. Start your next learning sprint.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
        <h2 className="text-2xl font-bold text-white">Learning Lab: Learn by Doing</h2>
        <p className="text-gray-300 mt-2">
          Train with a live-data paper portfolio, document each thesis, and build a repeatable process before risking real money.
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
          <p className="text-gray-400 text-xs">Trades Logged</p>
          <p className="text-xl text-white font-semibold">{state.trades.length}</p>
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
                className="px-4 py-2 rounded-lg bg-cyan-500/80 hover:bg-cyan-500 text-white font-medium"
              >
                Refresh Prices
              </button>
              <button
                type="button"
                onClick={resetSimulator}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium"
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
                  return (
                    <div key={position.ticker} className="bg-gray-800/70 border border-white/10 rounded-lg p-3">
                      <div className="flex justify-between">
                        <p className="text-white font-medium">{position.ticker} · {position.name}</p>
                        <p className={unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatMoney(unrealized)}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {position.shares} shares · Avg {formatMoney(position.avgCost)} · Last {formatMoney(position.currentPrice)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
            <h3 className="text-lg text-white font-semibold mb-2">Learning Missions</h3>
            <ul className="space-y-2 text-sm text-gray-300 list-disc pl-4">
              <li>Keep any one position ≤ 20% of your portfolio value.</li>
              <li>Only take trades with a written thesis and invalidation level.</li>
              <li>Reach 20 trades while maintaining a positive expectancy.</li>
              <li>Review your last 5 trades and write one process improvement.</li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
            <h3 className="text-lg text-white font-semibold mb-2">Trading Journal</h3>
            <textarea
              value={state.journal}
              onChange={(e) => setState((prev) => ({ ...prev, journal: e.target.value }))}
              className="w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-40"
              placeholder="What did you learn this week? Which setups worked? What risk mistakes will you avoid next week?"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
