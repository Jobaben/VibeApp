import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import WatchlistManager from '../components/WatchlistManager';
import ScoreChangeIndicator from '../components/ScoreChangeIndicator';
import { stockApi } from '../services/api';
import type { Stock } from '../types/stock';

interface WatchlistStockData extends Stock {
  isLoading?: boolean;
  error?: string;
  signal?: string;
  total_score?: number;
}

export default function Watchlists() {
  const { watchlists, createWatchlist, removeFromWatchlist } = useWatchlist();
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [stocksData, setStocksData] = useState<Record<string, WatchlistStockData>>({});

  // Select first watchlist by default
  useEffect(() => {
    if (watchlists.length > 0 && !selectedWatchlistId) {
      setSelectedWatchlistId(watchlists[0].id);
    }
  }, [watchlists, selectedWatchlistId]);

  // Fetch stock data for selected watchlist
  useEffect(() => {
    const selectedWatchlist = watchlists.find((w) => w.id === selectedWatchlistId);
    if (!selectedWatchlist) return;

    const fetchStockData = async () => {
      const newStocksData: Record<string, WatchlistStockData> = {};

      // Mark all as loading
      selectedWatchlist.tickers.forEach((ticker) => {
        newStocksData[ticker] = { isLoading: true } as WatchlistStockData;
      });
      setStocksData(newStocksData);

      // Fetch each stock
      await Promise.all(
        selectedWatchlist.tickers.map(async (ticker) => {
          try {
            const stock = await stockApi.getStockByTicker(ticker);
            newStocksData[ticker] = { ...stock, isLoading: false };
          } catch (error) {
            newStocksData[ticker] = {
              isLoading: false,
              error: 'Failed to load',
            } as WatchlistStockData;
          }
        })
      );

      setStocksData({ ...newStocksData });
    };

    fetchStockData();
  }, [selectedWatchlistId, watchlists]);

  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlistName.trim()) {
      const newWatchlist = createWatchlist(newWatchlistName.trim());
      setSelectedWatchlistId(newWatchlist.id);
      setNewWatchlistName('');
      setShowCreateForm(false);
    }
  };

  const selectedWatchlist = watchlists.find((w) => w.id === selectedWatchlistId);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'bg-green-600 text-white';
      case 'BUY':
        return 'bg-green-500 text-white';
      case 'HOLD':
        return 'bg-yellow-500 text-white';
      case 'SELL':
        return 'bg-red-500 text-white';
      case 'STRONG_SELL':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Watchlists</h1>
          <p className="text-gray-600">
            Track your favorite stocks and monitor their performance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Watchlist List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Watchlists</h2>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Create new watchlist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {showCreateForm && (
                <form onSubmit={handleCreateWatchlist} className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="text"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    placeholder="Watchlist name..."
                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewWatchlistName('');
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {watchlists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-3">No watchlists yet</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Create your first watchlist
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {watchlists.map((watchlist) => (
                    <WatchlistManager
                      key={watchlist.id}
                      watchlist={watchlist}
                      onSelect={() => setSelectedWatchlistId(watchlist.id)}
                      isSelected={watchlist.id === selectedWatchlistId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Stock List */}
          <div className="lg:col-span-3">
            {selectedWatchlist ? (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedWatchlist.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedWatchlist.tickers.length}{' '}
                    {selectedWatchlist.tickers.length === 1 ? 'stock' : 'stocks'}
                  </p>
                </div>

                {selectedWatchlist.tickers.length === 0 ? (
                  <div className="p-12 text-center">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No stocks in this watchlist
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start adding stocks to track their performance
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Stocks
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {selectedWatchlist.tickers.map((ticker) => {
                      const stockData = stocksData[ticker];
                      const isLoading = stockData?.isLoading;
                      const hasError = stockData?.error;

                      return (
                        <div key={ticker} className="p-6 hover:bg-gray-50 transition-colors">
                          {isLoading ? (
                            <div className="animate-pulse">
                              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            </div>
                          ) : hasError ? (
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {ticker}
                                </div>
                                <div className="text-red-600 text-sm">
                                  Failed to load stock data
                                </div>
                              </div>
                              <button
                                onClick={() => removeFromWatchlist(selectedWatchlist.id, ticker)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          ) : stockData ? (
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Link
                                    to={`/stock/${ticker}`}
                                    className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                  >
                                    {ticker}
                                  </Link>
                                  {stockData.signal && (
                                    <span
                                      className={`px-2 py-1 rounded-md text-xs font-semibold ${getSignalColor(
                                        stockData.signal
                                      )}`}
                                    >
                                      {stockData.signal.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-600 mb-2">{stockData.name}</div>
                                <div className="flex items-center gap-4 text-sm mb-2">
                                  <div>
                                    <span className="text-gray-500">Score:</span>{' '}
                                    <span className="font-semibold text-gray-900">
                                      {stockData.total_score?.toFixed(1) || 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Sector:</span>{' '}
                                    <span className="text-gray-900">{stockData.sector}</span>
                                  </div>
                                  {stockData.market_cap && (
                                    <div>
                                      <span className="text-gray-500">Market Cap:</span>{' '}
                                      <span className="text-gray-900">
                                        ${(stockData.market_cap / 1e9).toFixed(2)}B
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {/* Score Change Indicator */}
                                <div className="mt-2">
                                  <ScoreChangeIndicator ticker={ticker} days={7} variant="compact" />
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Link
                                  to={`/stock/${ticker}`}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  View Details
                                </Link>
                                <button
                                  onClick={() => removeFromWatchlist(selectedWatchlist.id, ticker)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove from watchlist"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a watchlist
                </h3>
                <p className="text-gray-600">
                  Choose a watchlist from the sidebar to view your stocks
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
