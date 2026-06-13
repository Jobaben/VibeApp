import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StockPicker from '../components/StockPicker';
import { usePortfolio } from '../contexts/PortfolioContext';
import { stockApi } from '../services/api';
import { getSignalColor, signalLabel, isWarningSignal } from '../utils/signal';
import type { Stock, StockDetail } from '../types/stock';

interface HoldingData {
  isLoading: boolean;
  error?: string;
  detail?: StockDetail;
}

export default function Portfolio() {
  const navigate = useNavigate();
  const { holdings, addHolding, updateHolding, removeHolding } = usePortfolio();

  const [data, setData] = useState<Record<string, HoldingData>>({});

  // Add-position form state
  const [pickedStock, setPickedStock] = useState<Stock | null>(null);
  const [shares, setShares] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline edit state
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editShares, setEditShares] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Fetch scores/signals for each holding
  useEffect(() => {
    holdings.forEach((h) => {
      if (data[h.ticker]) return; // already loaded or loading
      setData((prev) => ({ ...prev, [h.ticker]: { isLoading: true } }));
      stockApi
        .getStockDetail(h.ticker)
        .then((detail) => setData((prev) => ({ ...prev, [h.ticker]: { isLoading: false, detail } })))
        .catch(() => setData((prev) => ({ ...prev, [h.ticker]: { isLoading: false, error: 'Failed to load' } })));
    });
  }, [holdings, data]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!pickedStock) {
      setFormError('Select a stock first.');
      return;
    }
    const sharesNum = parseFloat(shares);
    const priceNum = parseFloat(avgPrice);
    if (!Number.isFinite(sharesNum) || sharesNum <= 0) {
      setFormError('Enter a valid number of shares.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setFormError('Enter a valid average buy price.');
      return;
    }
    addHolding({ ticker: pickedStock.ticker, name: pickedStock.name, shares: sharesNum, avgPrice: priceNum });
    setPickedStock(null);
    setShares('');
    setAvgPrice('');
  };

  const startEdit = (ticker: string, currentShares: number, currentPrice: number) => {
    setEditingTicker(ticker);
    setEditShares(String(currentShares));
    setEditPrice(String(currentPrice));
  };

  const saveEdit = (ticker: string) => {
    const sharesNum = parseFloat(editShares);
    const priceNum = parseFloat(editPrice);
    if (Number.isFinite(sharesNum) && sharesNum > 0 && Number.isFinite(priceNum) && priceNum > 0) {
      updateHolding(ticker, sharesNum, priceNum);
    }
    setEditingTicker(null);
  };

  // Portfolio-level aggregates
  const summary = useMemo(() => {
    const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avgPrice, 0);

    let weightedScoreSum = 0;
    let weightedScoreBase = 0;
    const signalCounts: Record<string, number> = {};
    const sectorCost: Record<string, number> = {};
    const toReview: string[] = [];

    holdings.forEach((h) => {
      const cost = h.shares * h.avgPrice;
      const detail = data[h.ticker]?.detail;
      const score = detail?.scores?.total_score;
      const signal = detail?.scores?.signal;
      if (score !== undefined && score !== null) {
        weightedScoreSum += Number(score) * cost;
        weightedScoreBase += cost;
      }
      if (signal) {
        signalCounts[signal] = (signalCounts[signal] || 0) + 1;
        if (isWarningSignal(signal)) toReview.push(h.ticker);
      }
      const sector = detail?.sector || 'Unknown';
      sectorCost[sector] = (sectorCost[sector] || 0) + cost;
    });

    const weightedAvgScore = weightedScoreBase > 0 ? weightedScoreSum / weightedScoreBase : null;
    const sectorAllocation = Object.entries(sectorCost)
      .map(([sector, cost]) => ({ sector, cost, pct: totalCost > 0 ? (cost / totalCost) * 100 : 0 }))
      .sort((a, b) => b.cost - a.cost);

    return { totalCost, weightedAvgScore, signalCounts, sectorAllocation, toReview };
  }, [holdings, data]);

  const formatMoney = (value: number): string =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const SIGNAL_ORDER = ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'];

  return (
    <>
      <header className="header-band">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-4xl font-bold heading-gradient">My Portfolio</h1>
          <p className="text-gray-400 mt-2">
            Track the positions you own and run them through our scoring engine to see what to review.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Add position */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add a position</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
            <div className="md:col-span-6">
              {pickedStock ? (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border border-cyan-500/30 rounded-xl">
                  <div>
                    <div className="font-bold text-white">{pickedStock.ticker}</div>
                    <div className="text-sm text-gray-400">{pickedStock.name}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickedStock(null)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    title="Change stock"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <StockPicker onSelect={setPickedStock} placeholder="Search for a stock you own..." />
              )}
            </div>
            <div className="md:col-span-2">
              <input
                type="number"
                step="any"
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="Shares"
                className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="number"
                step="any"
                min="0"
                value={avgPrice}
                onChange={(e) => setAvgPrice(e.target.value)}
                placeholder="Avg price"
                className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full px-4 py-3 rounded-xl btn-primary font-medium">
                Add
              </button>
            </div>
          </form>
          {formError && <p className="text-sm text-red-400 mt-3">{formError}</p>}
        </div>

        {holdings.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M9 17V9m4 8V5m4 12v-6" />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">Your portfolio is empty</h3>
            <p className="text-gray-400">Add positions above to track them and get our buy/sell read on each one.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-5">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Cost Basis</p>
                <p className="text-3xl font-bold text-white">{formatMoney(summary.totalCost)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {holdings.length} {holdings.length === 1 ? 'position' : 'positions'}
                </p>
              </div>
              <div className="glass-card p-5">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Weighted Avg Score</p>
                <p className="text-3xl font-bold text-white">
                  {summary.weightedAvgScore !== null ? summary.weightedAvgScore.toFixed(1) : '—'}
                  <span className="text-base text-gray-500 font-normal"> / 100</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">Cost-weighted across holdings</p>
              </div>
              <div className="glass-card p-5">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Positions to Review</p>
                <p className={`text-3xl font-bold ${summary.toReview.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {summary.toReview.length}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {summary.toReview.length > 0 ? summary.toReview.join(', ') : 'No SELL signals'}
                </p>
              </div>
            </div>

            {/* Signal distribution + sector allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Signal Mix</h3>
                <div className="flex flex-wrap gap-2">
                  {SIGNAL_ORDER.filter((s) => summary.signalCounts[s]).map((s) => (
                    <span key={s} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getSignalColor(s)}`}>
                      {signalLabel(s)}: {summary.signalCounts[s]}
                    </span>
                  ))}
                  {Object.keys(summary.signalCounts).length === 0 && (
                    <span className="text-sm text-gray-400">No scored holdings yet.</span>
                  )}
                </div>
              </div>
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Sector Allocation (by cost)</h3>
                <div className="space-y-2">
                  {summary.sectorAllocation.map(({ sector, pct }) => (
                    <div key={sector}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{sector}</span>
                        <span className="text-gray-400">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Holdings table */}
            <div className="glass-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-white/10">
                    <th className="py-3 px-4 text-left">Stock</th>
                    <th className="py-3 px-4 text-right">Shares</th>
                    <th className="py-3 px-4 text-right">Avg Price</th>
                    <th className="py-3 px-4 text-right">Cost Basis</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Signal</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const hd = data[h.ticker];
                    const detail = hd?.detail;
                    const cost = h.shares * h.avgPrice;
                    const isEditing = editingTicker === h.ticker;
                    return (
                      <tr key={h.ticker} className="border-t border-white/5 hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            to={`/stock/${encodeURIComponent(h.ticker)}`}
                            className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {h.ticker}
                          </Link>
                          <div className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{h.name}</div>
                        </td>
                        <td className="py-3 px-4 text-right text-white">
                          {isEditing ? (
                            <input
                              type="number"
                              step="any"
                              value={editShares}
                              onChange={(e) => setEditShares(e.target.value)}
                              className="w-20 px-2 py-1 bg-gray-800 border border-white/10 rounded text-right text-white"
                            />
                          ) : (
                            h.shares
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-white">
                          {isEditing ? (
                            <input
                              type="number"
                              step="any"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-24 px-2 py-1 bg-gray-800 border border-white/10 rounded text-right text-white"
                            />
                          ) : (
                            h.avgPrice.toFixed(2)
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-white">{formatMoney(cost)}</td>
                        <td className="py-3 px-4 text-center">
                          {hd?.isLoading ? (
                            <span className="text-gray-500">…</span>
                          ) : detail?.scores ? (
                            <span className="font-semibold text-white">{Number(detail.scores.total_score).toFixed(1)}</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {detail?.scores?.signal ? (
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getSignalColor(detail.scores.signal)}`}>
                              {signalLabel(detail.scores.signal)}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">{hd?.error ? 'N/A' : '—'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => saveEdit(h.ticker)} className="px-3 py-1 text-xs rounded-md btn-primary">
                                Save
                              </button>
                              <button onClick={() => setEditingTicker(null)} className="px-3 py-1 text-xs rounded-md btn-secondary">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => startEdit(h.ticker, h.shares, h.avgPrice)}
                                className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                title="Edit position"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeHolding(h.ticker)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remove position"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 px-1">
              Cost basis is calculated from the shares and average price you enter. Scores and signals come from our
              fundamental scoring engine — this is research tooling, not investment advice.
            </p>
          </>
        )}
      </main>
    </>
  );
}
