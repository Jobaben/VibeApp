import { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { stockApi } from '../services/api';
import type { MoversResponse, SignalChangesResponse } from '../types/stock';
import { ScoreMoverCard } from '../components/ScoreMoverCard';
import { SignalChangeCard } from '../components/SignalChangeCard';

type TimePeriod = 7 | 30 | 90;

export function WeeklyChanges() {
  const [period, setPeriod] = useState<TimePeriod>(7);
  const [gainers, setGainers] = useState<MoversResponse | null>(null);
  const [losers, setLosers] = useState<MoversResponse | null>(null);
  const [signalChanges, setSignalChanges] = useState<SignalChangesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [gainersData, losersData, signalsData] = await Promise.all([
          stockApi.getScoreMovers('up', period, 10),
          stockApi.getScoreMovers('down', period, 10),
          stockApi.getSignalChanges(period, 20)
        ]);

        setGainers(gainersData);
        setLosers(losersData);
        setSignalChanges(signalsData);
      } catch (err: any) {
        console.error('Error fetching weekly changes:', err);
        setError(err.response?.data?.detail || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const getPeriodLabel = (days: number) => {
    if (days === 7) return 'This Week';
    if (days === 30) return 'This Month';
    if (days === 90) return 'Last 3 Months';
    return `${days} Days`;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <ArrowPathIcon className="h-8 w-8 text-blue-400" />
                What Changed {getPeriodLabel(period)}
              </h1>
              <p className="text-gray-400 mt-1">
                Track the biggest score changes and signal updates
              </p>
            </div>

            {/* Time Period Filter */}
            <div className="flex gap-2">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setPeriod(days as TimePeriod)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    period === days
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-400">Loading changes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Gainers Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
                <h2 className="text-2xl font-bold text-white">Top Gainers</h2>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                  {gainers?.movers.length || 0} stocks
                </span>
              </div>

              {gainers && gainers.movers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {gainers.movers.map((mover, index) => (
                    <ScoreMoverCard key={mover.ticker} mover={mover} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                  <p className="text-gray-400">No gainers found for this period</p>
                </div>
              )}
            </section>

            {/* Top Losers Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
                <h2 className="text-2xl font-bold text-white">Top Losers</h2>
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                  {losers?.movers.length || 0} stocks
                </span>
              </div>

              {losers && losers.movers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {losers.movers.map((mover, index) => (
                    <ScoreMoverCard key={mover.ticker} mover={mover} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                  <p className="text-gray-400">No losers found for this period</p>
                </div>
              )}
            </section>

            {/* Signal Changes Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <ArrowPathIcon className="h-6 w-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Signal Changes</h2>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
                  {signalChanges?.changes.length || 0} stocks
                </span>
              </div>

              {signalChanges && signalChanges.changes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {signalChanges.changes.map((stock) => (
                    <SignalChangeCard key={stock.ticker} stock={stock} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                  <p className="text-gray-400">No signal changes found for this period</p>
                </div>
              )}
            </section>

            {/* Summary Stats */}
            <section className="mt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-400 font-medium">Biggest Gainer</p>
                      {gainers && gainers.movers.length > 0 && (
                        <>
                          <p className="text-2xl font-bold text-white mt-1">{gainers.movers[0].ticker}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            +{gainers.movers[0].change.toFixed(1)} points ({gainers.movers[0].percent_change.toFixed(1)}%)
                          </p>
                        </>
                      )}
                    </div>
                    <ArrowTrendingUpIcon className="h-12 w-12 text-green-400 opacity-50" />
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-400 font-medium">Biggest Loser</p>
                      {losers && losers.movers.length > 0 && (
                        <>
                          <p className="text-2xl font-bold text-white mt-1">{losers.movers[0].ticker}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {losers.movers[0].change.toFixed(1)} points ({losers.movers[0].percent_change.toFixed(1)}%)
                          </p>
                        </>
                      )}
                    </div>
                    <ArrowTrendingDownIcon className="h-12 w-12 text-red-400 opacity-50" />
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-400 font-medium">Signal Changes</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {signalChanges?.changes.length || 0}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">in {period} days</p>
                    </div>
                    <ArrowPathIcon className="h-12 w-12 text-purple-400 opacity-50" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeeklyChanges;
