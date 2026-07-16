import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { stockApi } from '../services/api';
import type { HorizonProfile, InvestmentHorizon, TopCandidatesResponse, TopCandidate } from '../types/stock';
import { getSignalColor, signalLabel } from '../utils/signal';

// Fallback shown until the profiles load (mirrors the backend defaults)
const DEFAULT_HORIZONS: HorizonProfile[] = [
  { key: 'short', label: 'Short term', period: 'Up to 3 months', description: '', weights: { value: 0.15, quality: 0.15, momentum: 0.5, health: 0.2 } },
  { key: 'medium', label: 'Medium term', period: '3-12 months', description: '', weights: { value: 0.25, quality: 0.25, momentum: 0.25, health: 0.25 } },
  { key: 'long', label: 'Long term', period: '1 year or more', description: '', weights: { value: 0.3, quality: 0.3, momentum: 0.15, health: 0.25 } },
];

const FACTOR_META: { key: keyof TopCandidate & ('value_score' | 'quality_score' | 'momentum_score' | 'health_score'); weightKey: 'value' | 'quality' | 'momentum' | 'health'; label: string; color: string }[] = [
  { key: 'value_score', weightKey: 'value', label: 'Value', color: 'bg-blue-500' },
  { key: 'quality_score', weightKey: 'quality', label: 'Quality', color: 'bg-purple-500' },
  { key: 'momentum_score', weightKey: 'momentum', label: 'Momentum', color: 'bg-amber-500' },
  { key: 'health_score', weightKey: 'health', label: 'Health', color: 'bg-emerald-500' },
];

const RANK_BADGES = ['🥇', '🥈', '🥉'];

function fitColor(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function fitBarColor(score: number): string {
  if (score >= 75) return 'bg-gradient-to-r from-green-500 to-emerald-400';
  if (score >= 50) return 'bg-gradient-to-r from-yellow-500 to-amber-400';
  return 'bg-gradient-to-r from-red-500 to-orange-400';
}

export default function TopPicks() {
  const [horizons, setHorizons] = useState<HorizonProfile[]>(DEFAULT_HORIZONS);
  const [horizon, setHorizon] = useState<InvestmentHorizon>('medium');
  const [result, setResult] = useState<TopCandidatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    stockApi.getInvestmentHorizons()
      .then(setHorizons)
      .catch((e) => console.warn('Failed to load horizon profiles:', e));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    stockApi.getTopCandidates(horizon, 10)
      .then(setResult)
      .catch((e) => {
        console.error('Failed to load top candidates:', e);
        setError(e?.response?.data?.detail || 'Failed to load top candidates');
      })
      .finally(() => setLoading(false));
  }, [horizon]);

  const activeProfile = horizons.find(h => h.key === horizon);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Intro */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Top Picks for Your Investment Period</h2>
        <p className="text-gray-400 max-w-3xl">
          Choose how long you plan to hold, and the ranking re-weights each stock's Value, Quality,
          Momentum and Financial Health scores to fit that horizon. Open a pick to see buy/sell
          signals on its price chart.
        </p>
      </div>

      {/* Investment period picker */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-300 mb-3">How long do you plan to invest?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {horizons.map((h) => (
            <button
              key={h.key}
              onClick={() => setHorizon(h.key)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                horizon === h.key
                  ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-gray-800/40 border-white/10 hover:border-white/25 hover:bg-gray-800/70'
              }`}
            >
              <p className={`font-semibold ${horizon === h.key ? 'text-cyan-300' : 'text-white'}`}>{h.label}</p>
              <p className="text-sm text-gray-400 mt-0.5">{h.period}</p>
            </button>
          ))}
        </div>
        {activeProfile && (result?.description || activeProfile.description) && (
          <div className="mt-3 flex flex-col md:flex-row md:items-center gap-3 text-sm text-gray-400">
            <p className="flex-1">{result?.description || activeProfile.description}</p>
            <div className="flex items-center gap-3 flex-shrink-0">
              {FACTOR_META.map(f => (
                <span key={f.weightKey} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-sm ${f.color}`}></span>
                  <span className="text-xs text-gray-400">
                    {f.label} {Math.round((result?.weights ?? activeProfile.weights)[f.weightKey] * 100)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      ) : !result || result.candidates.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-300 font-medium mb-1">No scored stocks yet</p>
          <p className="text-sm text-gray-500">
            Import stocks and run the score calculation first (see the Quick Start guide), then come back here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {result.candidates.map((c) => (
            <Link
              key={c.ticker}
              to={`/stock/${c.ticker}`}
              className={`block rounded-xl border p-4 transition-all duration-200 hover:border-cyan-400/40 hover:bg-gray-800/60 ${
                c.rank <= 3
                  ? 'bg-gradient-to-r from-gray-800/70 to-gray-800/40 border-amber-400/30'
                  : 'bg-gray-800/40 border-white/10'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Rank + identity */}
                <div className="flex items-center gap-4 lg:w-1/3 min-w-0">
                  <span className="flex-shrink-0 w-10 text-center text-2xl font-bold text-gray-400">
                    {c.rank <= 3 ? RANK_BADGES[c.rank - 1] : `#${c.rank}`}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{c.name}</p>
                    <p className="text-sm text-gray-400">
                      <span className="font-mono text-cyan-400">{c.ticker}</span>
                      {c.sector && <span> · {c.sector}</span>}
                    </p>
                  </div>
                </div>

                {/* Horizon fit score */}
                <div className="lg:w-1/4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Horizon fit</span>
                    <span className={`text-lg font-bold ${fitColor(c.horizon_score)}`}>{c.horizon_score.toFixed(0)}<span className="text-xs text-gray-500 font-normal">/100</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700/70 overflow-hidden">
                    <div className={`h-full rounded-full ${fitBarColor(c.horizon_score)}`} style={{ width: `${Math.min(c.horizon_score, 100)}%` }}></div>
                  </div>
                </div>

                {/* Factor mini-bars */}
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {FACTOR_META.map(f => (
                    <div key={f.key}>
                      <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">{f.label}</p>
                      <div className="h-1.5 rounded-full bg-gray-700/70 overflow-hidden">
                        <div className={`h-full rounded-full ${f.color}`} style={{ width: `${(Number(c[f.key]) / 25) * 100}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{Number(c[f.key]).toFixed(0)}/25</p>
                    </div>
                  ))}
                </div>

                {/* Signal badge */}
                <div className="flex-shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getSignalColor(c.signal)}`}>
                    {signalLabel(c.signal)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 lg:ml-14">{c.why}</p>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-8">
        Rankings re-weight existing factor scores per horizon and are for educational purposes only — not financial advice.
      </p>
    </div>
  );
}
