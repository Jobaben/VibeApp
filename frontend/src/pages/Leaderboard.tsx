import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockApi } from '../services/api';
import type { LeaderboardStock, SectorLeaderboard } from '../types/stock';
import { Signal } from '../types/stock';

type LeaderboardTab = 'top' | 'signals' | 'sectors';

const signalConfig: Record<Signal, { bg: string; text: string; label: string; emoji: string }> = {
  STRONG_BUY: { bg: 'bg-green-600', text: 'text-green-400', label: 'STRONG BUY', emoji: '🟢' },
  BUY: { bg: 'bg-green-500', text: 'text-green-300', label: 'BUY', emoji: '🟢' },
  HOLD: { bg: 'bg-yellow-500', text: 'text-yellow-300', label: 'HOLD', emoji: '🟡' },
  SELL: { bg: 'bg-red-500', text: 'text-red-300', label: 'SELL', emoji: '🔴' },
  STRONG_SELL: { bg: 'bg-red-600', text: 'text-red-400', label: 'STRONG SELL', emoji: '🔴' },
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('top');
  const [topStocks, setTopStocks] = useState<LeaderboardStock[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<Signal>(Signal.STRONG_BUY);
  const [signalStocks, setSignalStocks] = useState<LeaderboardStock[]>([]);
  const [sectorLeaderboard, setSectorLeaderboard] = useState<SectorLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch top stocks
  useEffect(() => {
    if (activeTab === 'top') {
      setLoading(true);
      setError(null);
      stockApi.getLeaderboard(20)
        .then(setTopStocks)
        .catch(err => {
          console.error('Error fetching leaderboard:', err);
          setError('Failed to load leaderboard');
        })
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  // Fetch stocks by signal
  useEffect(() => {
    if (activeTab === 'signals') {
      setLoading(true);
      setError(null);
      stockApi.getStocksBySignal(selectedSignal, 20)
        .then(setSignalStocks)
        .catch(err => {
          console.error('Error fetching stocks by signal:', err);
          setError('Failed to load stocks');
        })
        .finally(() => setLoading(false));
    }
  }, [activeTab, selectedSignal]);

  // Fetch sector leaderboard
  useEffect(() => {
    if (activeTab === 'sectors') {
      setLoading(true);
      setError(null);
      stockApi.getSectorLeaderboards(5)
        .then(setSectorLeaderboard)
        .catch(err => {
          console.error('Error fetching sector leaderboard:', err);
          setError('Failed to load sector leaderboard');
        })
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const tabs = [
    { id: 'top' as LeaderboardTab, label: 'Top Stocks', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'signals' as LeaderboardTab, label: 'By Signal', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
    { id: 'sectors' as LeaderboardTab, label: 'By Sector', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-xl bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Stock Leaderboard
              </h1>
              <p className="text-gray-400 mt-2">Top-performing stocks ranked by our multi-factor scoring system</p>
            </div>

            {/* Tab Navigation */}
            <nav className="flex gap-2 mt-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Top Stocks Tab */}
          {activeTab === 'top' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Top 20 Stocks</h2>
                <p className="text-gray-400 text-sm">Highest overall scores across all factors</p>
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <StockTable
                  stocks={topStocks}
                  onRowClick={(ticker) => navigate(`/stock/${encodeURIComponent(ticker)}`)}
                  showRank
                />
              )}
            </div>
          )}

          {/* By Signal Tab */}
          {activeTab === 'signals' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Filter by Buy/Sell Signal</h2>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(signalConfig).map(([signal, config]) => (
                    <button
                      key={signal}
                      onClick={() => setSelectedSignal(signal as Signal)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedSignal === signal
                          ? `${config.bg} text-white`
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {config.emoji} {config.label}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : signalStocks.length === 0 ? (
                <div className="bg-gray-800/50 border border-white/10 rounded-lg p-8 text-center">
                  <p className="text-gray-400">No stocks found with {signalConfig[selectedSignal].label} signal</p>
                </div>
              ) : (
                <StockTable
                  stocks={signalStocks}
                  onRowClick={(ticker) => navigate(`/stock/${encodeURIComponent(ticker)}`)}
                />
              )}
            </div>
          )}

          {/* By Sector Tab */}
          {activeTab === 'sectors' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Top Stocks by Sector</h2>
                <p className="text-gray-400 text-sm">Best performers in each sector</p>
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : sectorLeaderboard ? (
                <div className="space-y-6">
                  {Object.entries(sectorLeaderboard).map(([sector, stocks]) => (
                    <div key={sector} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-400 mr-3"></span>
                        {sector}
                      </h3>
                      <StockTable
                        stocks={stocks}
                        onRowClick={(ticker) => navigate(`/stock/${encodeURIComponent(ticker)}`)}
                        compact
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800/50 border border-white/10 rounded-lg p-8 text-center">
                  <p className="text-gray-400">No sector data available</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Stock Table Component
function StockTable({
  stocks,
  onRowClick,
  showRank = false,
  compact = false,
}: {
  stocks: LeaderboardStock[];
  onRowClick: (ticker: string) => void;
  showRank?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            {showRank && <th className="text-left p-3 text-gray-400 text-sm font-medium">#</th>}
            <th className="text-left p-3 text-gray-400 text-sm font-medium">Stock</th>
            {!compact && <th className="text-left p-3 text-gray-400 text-sm font-medium">Sector</th>}
            <th className="text-left p-3 text-gray-400 text-sm font-medium">Score</th>
            <th className="text-left p-3 text-gray-400 text-sm font-medium">Signal</th>
            {!compact && (
              <>
                <th className="text-center p-3 text-gray-400 text-sm font-medium">Value</th>
                <th className="text-center p-3 text-gray-400 text-sm font-medium">Quality</th>
                <th className="text-center p-3 text-gray-400 text-sm font-medium">Momentum</th>
                <th className="text-center p-3 text-gray-400 text-sm font-medium">Health</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => {
            const config = signalConfig[stock.signal];
            return (
              <tr
                key={stock.ticker}
                onClick={() => onRowClick(stock.ticker)}
                className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                {showRank && (
                  <td className="p-3">
                    <span className="text-gray-400 font-mono text-sm">{index + 1}</span>
                  </td>
                )}
                <td className="p-3">
                  <div>
                    <p className="font-semibold text-white">{stock.ticker}</p>
                    <p className="text-sm text-gray-400 truncate max-w-xs">{stock.name}</p>
                  </div>
                </td>
                {!compact && (
                  <td className="p-3">
                    <span className="text-sm text-gray-300">{stock.sector}</span>
                  </td>
                )}
                <td className="p-3">
                  <span className="text-xl font-bold text-white">{stock.total_score.toFixed(1)}</span>
                </td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.text}`}>
                    {config.label}
                  </span>
                </td>
                {!compact && (
                  <>
                    <td className="p-3 text-center">
                      <ScorePill score={stock.value_score} max={25} />
                    </td>
                    <td className="p-3 text-center">
                      <ScorePill score={stock.quality_score} max={25} />
                    </td>
                    <td className="p-3 text-center">
                      <ScorePill score={stock.momentum_score} max={25} />
                    </td>
                    <td className="p-3 text-center">
                      <ScorePill score={stock.health_score} max={25} />
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Score Pill Component
function ScorePill({ score, max }: { score: number; max: number }) {
  const percentage = (score / max) * 100;
  let color = 'text-red-400';
  if (percentage >= 70) color = 'text-green-400';
  else if (percentage >= 50) color = 'text-yellow-400';

  return (
    <span className={`font-semibold ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}
