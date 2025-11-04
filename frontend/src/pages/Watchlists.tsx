import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import { stockApi } from '../services/api';
import type { Stock, StockScore } from '../types/stock';

interface WatchlistStockData extends Stock {
  score?: StockScore | null;
}

export default function Watchlists() {
  const navigate = useNavigate();
  const {
    watchlists,
    createWatchlist,
    deleteWatchlist,
    renameWatchlist,
    removeFromWatchlist,
  } = useWatchlist();

  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);
  const [stocksData, setStocksData] = useState<Record<string, WatchlistStockData>>({});
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDesc, setNewWatchlistDesc] = useState('');
  const [editingWatchlist, setEditingWatchlist] = useState<{ id: string; name: string; description?: string } | null>(null);

  // Select first watchlist by default
  useEffect(() => {
    if (watchlists.length > 0 && !selectedWatchlistId) {
      setSelectedWatchlistId(watchlists[0].id);
    }
  }, [watchlists, selectedWatchlistId]);

  // Fetch stock data for selected watchlist
  useEffect(() => {
    const fetchStockData = async () => {
      const selectedWatchlist = watchlists.find((wl) => wl.id === selectedWatchlistId);
      if (!selectedWatchlist || selectedWatchlist.tickers.length === 0) {
        setStocksData({});
        return;
      }

      setLoading(true);
      try {
        const dataPromises = selectedWatchlist.tickers.map(async (ticker) => {
          const [stockData, scoreData] = await Promise.all([
            stockApi.getStockByTicker(ticker),
            stockApi.getScoreBreakdown(ticker, false).catch(() => null),
          ]);

          return {
            ticker,
            data: {
              ...stockData,
              score: scoreData ? {
                id: scoreData.ticker,
                stock_id: stockData.id,
                total_score: scoreData.total_score,
                value_score: scoreData.component_scores.value,
                quality_score: scoreData.component_scores.quality,
                momentum_score: scoreData.component_scores.momentum,
                health_score: scoreData.component_scores.health,
                signal: scoreData.signal,
                calculated_at: new Date().toISOString(),
              } : null,
            },
          };
        });

        const results = await Promise.all(dataPromises);
        const dataMap = results.reduce((acc, { ticker, data }) => {
          acc[ticker] = data;
          return acc;
        }, {} as Record<string, WatchlistStockData>);

        setStocksData(dataMap);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [selectedWatchlistId, watchlists]);

  const handleCreateWatchlist = () => {
    if (newWatchlistName.trim()) {
      createWatchlist(newWatchlistName.trim(), newWatchlistDesc.trim() || undefined);
      setNewWatchlistName('');
      setNewWatchlistDesc('');
      setShowCreateModal(false);
    }
  };

  const handleRenameWatchlist = () => {
    if (editingWatchlist && newWatchlistName.trim()) {
      renameWatchlist(editingWatchlist.id, newWatchlistName.trim(), newWatchlistDesc.trim() || undefined);
      setNewWatchlistName('');
      setNewWatchlistDesc('');
      setEditingWatchlist(null);
      setShowRenameModal(false);
    }
  };

  const handleDeleteWatchlist = (id: string) => {
    if (window.confirm('Are you sure you want to delete this watchlist?')) {
      deleteWatchlist(id);
      if (selectedWatchlistId === id) {
        setSelectedWatchlistId(watchlists.length > 1 ? watchlists.find((wl) => wl.id !== id)?.id || null : null);
      }
    }
  };

  const openRenameModal = (id: string, name: string, description?: string) => {
    setEditingWatchlist({ id, name, description });
    setNewWatchlistName(name);
    setNewWatchlistDesc(description || '');
    setShowRenameModal(true);
  };

  const selectedWatchlist = watchlists.find((wl) => wl.id === selectedWatchlistId);
  const watchlistStocks = selectedWatchlist?.tickers.map((ticker) => stocksData[ticker]).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Ambient background */}
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  My Watchlists
                </h1>
                <p className="text-gray-400 mt-2">Track your favorite stocks and monitor score changes</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Watchlist
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Watchlist Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                <h2 className="text-lg font-bold text-white mb-4">Watchlists</h2>
                <div className="space-y-2">
                  {watchlists.map((wl) => (
                    <div
                      key={wl.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedWatchlistId === wl.id
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'bg-gray-700/30 border border-transparent hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedWatchlistId(wl.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{wl.name}</p>
                          <p className="text-xs text-gray-400">{wl.tickers.length} stocks</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRenameModal(wl.id, wl.name, wl.description);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                            title="Rename"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {watchlists.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWatchlist(wl.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Watchlist Content */}
            <div className="md:col-span-3">
              {selectedWatchlist && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">{selectedWatchlist.name}</h2>
                    {selectedWatchlist.description && (
                      <p className="text-gray-400 mt-1">{selectedWatchlist.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedWatchlist.tickers.length} stock{selectedWatchlist.tickers.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : watchlistStocks.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-400">This watchlist is empty</p>
                      <p className="text-gray-500 text-sm mt-2">Add stocks from the Browse or Leaderboard pages</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {watchlistStocks.map((stock) => (
                        <div
                          key={stock.ticker}
                          className="bg-gray-700/30 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                          onClick={() => navigate(`/stock/${stock.ticker}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-white">{stock.ticker}</h3>
                                {stock.score && (
                                  <span className="text-2xl font-bold text-cyan-400">
                                    {stock.score.total_score.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-300 mb-2">{stock.name}</p>
                              {stock.sector && (
                                <span className="inline-block px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded">
                                  {stock.sector}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {stock.score && (
                                <div className="text-right mr-4">
                                  <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div>
                                      <p className="text-gray-500">Value</p>
                                      <p className="text-white font-semibold">{stock.score.value_score.toFixed(1)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Quality</p>
                                      <p className="text-white font-semibold">{stock.score.quality_score.toFixed(1)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Momentum</p>
                                      <p className="text-white font-semibold">{stock.score.momentum_score.toFixed(1)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Health</p>
                                      <p className="text-white font-semibold">{stock.score.health_score.toFixed(1)}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromWatchlist(selectedWatchlist.id, stock.ticker);
                                }}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                title="Remove from watchlist"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Watchlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Watchlist</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="e.g., Growth Stocks"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                <textarea
                  value={newWatchlistDesc}
                  onChange={(e) => setNewWatchlistDesc(e.target.value)}
                  placeholder="e.g., High growth tech companies"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewWatchlistName('');
                    setNewWatchlistDesc('');
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWatchlist}
                  disabled={!newWatchlistName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Watchlist Modal */}
      {showRenameModal && editingWatchlist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Rename Watchlist</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                <textarea
                  value={newWatchlistDesc}
                  onChange={(e) => setNewWatchlistDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRenameModal(false);
                    setNewWatchlistName('');
                    setNewWatchlistDesc('');
                    setEditingWatchlist(null);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameWatchlist}
                  disabled={!newWatchlistName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
