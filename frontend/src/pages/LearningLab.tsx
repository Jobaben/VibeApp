import { useEffect, useMemo, useState } from 'react';
import { stockApi } from '../services/api';
import type { Position, SimulatorState } from '../types/learningLab';
import type { LeaderboardStock } from '../types/stock';

const STARTING_CASH = 100000;
const STORAGE_KEY = 'learning-lab-simulator-v1';

const createDefaultState = (): SimulatorState => ({
  cash: STARTING_CASH,
  positions: [],
  trades: [],
  plans: [],
  journal: '',
});

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);

function loadState(): SimulatorState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return createDefaultState();
  }

  try {
    return JSON.parse(stored) as SimulatorState;
  } catch {
    return createDefaultState();
  }
}

export default function LearningLab() {
  const [marketIdeas, setMarketIdeas] = useState<LeaderboardStock[]>([]);
  const [state, setState] = useState<SimulatorState>(createDefaultState());
  const [selectedTicker, setSelectedTicker] = useState('');
  const [sharesInput, setSharesInput] = useState('10');
  const [reasonInput, setReasonInput] = useState('');
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const initial = loadState();
    setState(initial);
  }, []);

  useEffect(() => {
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
    () => state.cash + state.positions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0),
    [state.cash, state.positions]
  );
  const totalPnl = portfolioValue - STARTING_CASH;

  const refreshPositionPrices = async () => {
    if (state.positions.length === 0) {
      return;
    }

    const updated: Position[] = await Promise.all(
      state.positions.map(async (position) => {
        try {
          const historical = await stockApi.getHistoricalPrices(position.ticker, '1mo', false);
          const latest = historical.data[historical.data.length - 1];
          if (latest?.close) {
            return { ...position, currentPrice: latest.close };
          }
          return position;
        } catch {
          return position;
        }
      })
    );

    setState((prev) => ({ ...prev, positions: updated }));
    setActionMessage('Portfolio prices refreshed from market data.');
  };

  const executeTrade = async (type: 'BUY' | 'SELL') => {
    const shares = Number(sharesInput);
    if (!selectedTicker || !Number.isFinite(shares) || shares <= 0) {
      setActionMessage('Pick a ticker and valid share amount.');
      return;
    }

    const stock = marketIdeas.find((item) => item.ticker === selectedTicker);
    if (!stock) {
      setActionMessage('Ticker not available right now.');
      return;
    }

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
    const reason = reasonInput.trim() || 'No reason recorded';

    setState((prev) => {
      const positions = [...prev.positions];
      const existingIndex = positions.findIndex((p) => p.ticker === selectedTicker);
      const existing = existingIndex >= 0 ? positions[existingIndex] : undefined;

      if (type === 'BUY') {
        if (tradeValue > prev.cash) {
          setActionMessage('Not enough cash. Reduce size or sell another position.');
          return prev;
        }

        if (existing) {
          const totalShares = existing.shares + shares;
          const newAvgCost = (existing.avgCost * existing.shares + executionPrice * shares) / totalShares;
          positions[existingIndex] = {
            ...existing,
            shares: totalShares,
            avgCost: newAvgCost,
            currentPrice: executionPrice,
          };
        } else {
          positions.push({
            ticker: selectedTicker,
            name: stock.name,
            shares,
            avgCost: executionPrice,
            currentPrice: executionPrice,
          });
        }

        return {
          ...prev,
          cash: prev.cash - tradeValue,
          positions,
          trades: [
            {
              id: `${Date.now()}-${Math.random()}`,
              ticker: selectedTicker,
              type,
              shares,
              price: executionPrice,
              timestamp: new Date().toISOString(),
              reason,
            },
            ...prev.trades,
          ],
        };
      }

      if (!existing || existing.shares < shares) {
        setActionMessage('You cannot sell more shares than you own.');
        return prev;
      }

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
        trades: [
          {
            id: `${Date.now()}-${Math.random()}`,
            ticker: selectedTicker,
            type,
            shares,
            price: executionPrice,
            timestamp: new Date().toISOString(),
            reason,
          },
          ...prev.trades,
        ],
      };
    });

    setReasonInput('');
    setActionMessage(`${type} order filled: ${shares} ${selectedTicker} @ ${formatMoney(executionPrice)}.`);
  };

  const resetSimulator = () => {
    const next = createDefaultState();
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
            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Why this trade? (signal, setup, risk/reward, stop-loss)"
              className="w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 min-h-20"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => executeTrade('BUY')}
                className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white font-medium"
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => executeTrade('SELL')}
                className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-medium"
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
