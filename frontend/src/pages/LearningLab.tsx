import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GuidedPracticeFlow,
  LearningDashboardCard,
  LearningLabCopy,
  PracticeChecklist,
  PracticeIntroPanel,
  PracticePositions,
  SellReviewPanel,
} from '../components/learningLab';
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
  const [reviewingPositionTicker, setReviewingPositionTicker] = useState<string | null>(null);
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
  const tickerOptions = useMemo(() => {
    const options = new Map<string, { ticker: string; name: string }>();
    marketIdeas.forEach((idea) => options.set(idea.ticker, { ticker: idea.ticker, name: idea.name }));
    state.positions.forEach((position) => {
      if (!options.has(position.ticker)) {
        options.set(position.ticker, { ticker: position.ticker, name: position.name });
      }
    });
    return [...options.values()];
  }, [marketIdeas, state.positions]);

  useEffect(() => {
    if (!selectedTicker && state.positions.length > 0) {
      setSelectedTicker(state.positions[0].ticker);
    }
  }, [selectedTicker, state.positions]);

  const openReviewForPosition = (ticker: string) => {
    if (isExecutingTradeRef.current) {
      setActionMessage('Wait for the current practice order to finish before reviewing a position.');
      return;
    }
    const position = stateRef.current.positions.find((p) => p.ticker === ticker);
    if (!position) {
      return;
    }
    setReviewingPositionTicker(ticker);
    setSharesInput(String(position.shares));
    setSellReviewForm(createDefaultSellReviewForm());
  };

  const closeReview = () => setReviewingPositionTicker(null);

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
    const tradeTicker = type === 'SELL' ? reviewingPositionTicker ?? selectedTicker : selectedTicker;
    if (!tradeTicker || !Number.isFinite(shares) || shares <= 0) {
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

    const existingPosition = stateRef.current.positions.find((position) => position.ticker === tradeTicker);

    if (type === 'SELL' && submittedSellReviewForm.lessonLearned.trim().length === 0) {
      setActionMessage('Write one lesson learned before selling. This makes the paper trade useful practice.');
      return;
    }

    if (type === 'SELL' && !existingPosition) {
      setActionMessage('You cannot sell more shares than you own.');
      return;
    }

    isExecutingTradeRef.current = true;
    setIsExecutingTrade(true);

    try {
      let executionPrice = watchPrice;
      try {
        const historical = await stockApi.getHistoricalPrices(tradeTicker, '1mo', false);
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
        if (existingPosition) {
          setActionMessage('Close or review the existing practice position before starting a new plan for this ticker.');
          return;
        }

        const stock = marketIdeas.find((item) => item.ticker === tradeTicker);
        if (!stock) {
          setActionMessage('Ticker not available right now.');
          return;
        }

        const plan: TradePlan = {
          id: `${Date.now()}-${Math.random()}-plan`,
          ticker: tradeTicker,
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
          ticker: tradeTicker,
          type,
          shares,
          price: executionPrice,
          timestamp,
          reason: plan.reasonForBuying,
          planId: plan.id,
        };

        const result = applyLearningLabBuyTrade(stateRef.current, {
          selectedTicker: tradeTicker,
          stockName: stock.name,
          shares,
          tradeValue,
          executionPrice,
          plan,
          trade,
        });
        if (!result.applied) {
          setActionMessage(
            result.reason === 'position_exists'
              ? 'Close or review the existing practice position before starting a new plan for this ticker.'
              : 'Not enough cash. Reduce size or sell another position.'
          );
          return;
        }

        commitSimulatorState(result.state);
        setPlanForm((current) =>
          areTradePlanFormsEqual(current, submittedPlanForm) ? createDefaultPlanForm() : current
        );
        setActionMessage(`${type} order filled: ${shares} ${tradeTicker} @ ${formatMoney(executionPrice)}.`);
        return;
      }

      const latestExistingPosition = stateRef.current.positions.find((p) => p.ticker === tradeTicker);
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
        ticker: tradeTicker,
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
        selectedTicker: tradeTicker,
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
      setReviewingPositionTicker(null);
      setActionMessage(`${type} order filled: ${shares} ${tradeTicker} @ ${formatMoney(executionPrice)}.`);
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
    setReviewingPositionTicker(null);
    setActionMessage('Simulator reset. Start your next learning sprint.');
  };

  const reviewedPosition = reviewingPositionTicker
    ? state.positions.find((p) => p.ticker === reviewingPositionTicker) ?? null
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <PracticeIntroPanel />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
          <p className="text-gray-400 text-xs">{LearningLabCopy.DASHBOARD.cashLabel}</p>
          <p className="text-xl text-white font-semibold">{formatMoney(state.cash)}</p>
        </div>
        <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
          <p className="text-gray-400 text-xs">{LearningLabCopy.DASHBOARD.portfolioValueLabel}</p>
          <p className="text-xl text-white font-semibold">{formatMoney(portfolioValue)}</p>
        </div>
        <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
          <p className="text-gray-400 text-xs">{LearningLabCopy.DASHBOARD.totalPnlLabel}</p>
          <p className={`text-xl font-semibold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatMoney(totalPnl)}
          </p>
        </div>
        <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
          <p className="text-gray-400 text-xs">{LearningLabCopy.DASHBOARD.planFollowingTopLabel}</p>
          <p className="text-xl text-white font-semibold">{dashboardMetrics.planFollowingRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <GuidedPracticeFlow
            tickerOptions={tickerOptions}
            selectedTicker={selectedTicker}
            onSelectedTickerChange={setSelectedTicker}
            loadingIdeas={loadingIdeas}
            sharesInput={sharesInput}
            onSharesInputChange={setSharesInput}
            watchPriceLabel={formatMoney(watchPrice || 0)}
            planForm={planForm}
            onPlanFormChange={setPlanForm}
            positionSize={positionSize}
            isOversizedTrade={isOversizedTrade}
            canBuy={canBuy}
            isExecutingTrade={isExecutingTrade}
            onBuy={() => executeTrade('BUY')}
            onResetSimulator={resetSimulator}
            onRefreshPrices={refreshPositionPrices}
            actionMessage={actionMessage}
          />

          {reviewedPosition && (
            <SellReviewPanel
              position={reviewedPosition}
              sellReviewForm={sellReviewForm}
              onSellReviewFormChange={setSellReviewForm}
              sharesInput={sharesInput}
              onSharesInputChange={setSharesInput}
              isExecutingTrade={isExecutingTrade}
              onConfirmSell={() => executeTrade('SELL')}
              onCancel={closeReview}
            />
          )}

          <PracticePositions
            positions={state.positions}
            plansById={plansById}
            formatMoney={formatMoney}
            onReviewAndSell={openReviewForPosition}
            reviewingTicker={reviewingPositionTicker}
          />
        </div>

        <div className="space-y-4">
          <LearningDashboardCard metrics={dashboardMetrics} formatMoney={formatMoney} />

          <PracticeChecklist />

          <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
            <h3 className="text-lg text-white font-semibold mb-2">{LearningLabCopy.JOURNAL.sectionTitle}</h3>
            <textarea
              value={state.journal}
              onChange={(e) => commitSimulatorState(updateLearningLabJournal(stateRef.current, e.target.value))}
              className="w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-40"
              placeholder={LearningLabCopy.JOURNAL.placeholder}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
        <h3 className="text-lg text-white font-semibold mb-3">{LearningLabCopy.RECENT_TRADES.sectionTitle}</h3>
        {state.trades.length === 0 ? (
          <p className="text-gray-400">{LearningLabCopy.RECENT_TRADES.emptyMessage}</p>
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
