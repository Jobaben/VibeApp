import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stockApi } from '../services/api';
import type { StockDetail as StockDetailType, ScoreBreakdownResponse, HistoricalPricesResponse } from '../types/stock';
import PriceChart from '../components/PriceChart';
import RSIChart from '../components/RSIChart';
import VolumeChart from '../components/VolumeChart';
import ScoreBreakdown from '../components/ScoreBreakdown';

type Tab = 'overview' | 'charts' | 'fundamentals' | 'score';

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stock, setStock] = useState<StockDetailType | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdownResponse | null>(null);
  const [priceData, setPriceData] = useState<HistoricalPricesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch stock details, score breakdown, and price data in parallel
        const [stockData, scoreData, pricesData] = await Promise.all([
          stockApi.getStockByTicker(ticker),
          stockApi.getScoreBreakdown(ticker, true),
          stockApi.getHistoricalPrices(ticker, '1y', true),
        ]);

        setStock(stockData);
        setScoreBreakdown(scoreData);
        setPriceData(pricesData);
      } catch (err: any) {
        console.error('Error fetching stock data:', err);
        setError(err.response?.data?.detail || 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (error || !stock || !scoreBreakdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Stock</h3>
            <p className="text-gray-300 mb-4">{error || 'Stock not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'charts', label: 'Charts', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
    { id: 'fundamentals', label: 'Fundamentals', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'score', label: 'Score Analysis', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white">{stock.name}</h1>
                <p className="text-gray-400 mt-1 flex items-center gap-3">
                  <span className="text-2xl font-mono text-cyan-400">{stock.ticker}</span>
                  {stock.sector && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-sm">{stock.sector}</span>
                    </>
                  )}
                  {stock.exchange && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-sm">{stock.exchange}</span>
                    </>
                  )}
                </p>
              </div>
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <p className="text-gray-400 text-sm mb-1">Total Score</p>
                  <p className="text-3xl font-bold text-white">{scoreBreakdown.total_score.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">out of 100</p>
                </div>
                {stock.market_cap && (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <p className="text-gray-400 text-sm mb-1">Market Cap</p>
                    <p className="text-2xl font-bold text-white">
                      ${(stock.market_cap / 1e9).toFixed(1)}B
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stock.currency}</p>
                  </div>
                )}
                {stock.fundamentals?.pe_ratio && (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <p className="text-gray-400 text-sm mb-1">P/E Ratio</p>
                    <p className="text-2xl font-bold text-white">{stock.fundamentals.pe_ratio.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Price to Earnings</p>
                  </div>
                )}
                {stock.fundamentals?.dividend_yield && (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <p className="text-gray-400 text-sm mb-1">Dividend Yield</p>
                    <p className="text-2xl font-bold text-white">{stock.fundamentals.dividend_yield.toFixed(2)}%</p>
                    <p className="text-xs text-gray-500 mt-1">Annual yield</p>
                  </div>
                )}
              </div>

              {/* Score Breakdown */}
              <ScoreBreakdown breakdown={scoreBreakdown} />

              {/* Quick Price Chart */}
              {priceData && priceData.data.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-4">Price Chart (1 Year)</h2>
                  <PriceChart data={priceData.data} showMovingAverages={true} height={300} />
                </div>
              )}
            </div>
          )}

          {/* Charts Tab */}
          {activeTab === 'charts' && priceData && priceData.data.length > 0 && (
            <div className="space-y-6">
              {/* Price Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">Price & Moving Averages</h2>
                <PriceChart data={priceData.data} showMovingAverages={true} height={400} />
              </div>

              {/* RSI Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <RSIChart data={priceData.data} height={250} />
              </div>

              {/* Volume Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <VolumeChart data={priceData.data} height={250} />
              </div>
            </div>
          )}

          {/* Fundamentals Tab */}
          {activeTab === 'fundamentals' && stock.fundamentals && (
            <div className="space-y-6">
              {/* Valuation Metrics */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Valuation Metrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stock.fundamentals.pe_ratio != null && (
                    <MetricCard label="P/E Ratio" value={stock.fundamentals.pe_ratio.toFixed(2)} />
                  )}
                  {stock.fundamentals.pb_ratio != null && (
                    <MetricCard label="P/B Ratio" value={stock.fundamentals.pb_ratio.toFixed(2)} />
                  )}
                  {stock.fundamentals.peg_ratio != null && (
                    <MetricCard label="PEG Ratio" value={stock.fundamentals.peg_ratio.toFixed(2)} />
                  )}
                  {stock.fundamentals.ev_ebitda != null && (
                    <MetricCard label="EV/EBITDA" value={stock.fundamentals.ev_ebitda.toFixed(2)} />
                  )}
                  {stock.fundamentals.ps_ratio != null && (
                    <MetricCard label="P/S Ratio" value={stock.fundamentals.ps_ratio.toFixed(2)} />
                  )}
                </div>
              </div>

              {/* Profitability Metrics */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Profitability Metrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stock.fundamentals.roic != null && (
                    <MetricCard label="ROIC" value={`${stock.fundamentals.roic.toFixed(2)}%`} />
                  )}
                  {stock.fundamentals.roe != null && (
                    <MetricCard label="ROE" value={`${stock.fundamentals.roe.toFixed(2)}%`} />
                  )}
                  {stock.fundamentals.gross_margin != null && (
                    <MetricCard label="Gross Margin" value={`${stock.fundamentals.gross_margin.toFixed(2)}%`} />
                  )}
                  {stock.fundamentals.operating_margin != null && (
                    <MetricCard label="Operating Margin" value={`${stock.fundamentals.operating_margin.toFixed(2)}%`} />
                  )}
                  {stock.fundamentals.net_margin != null && (
                    <MetricCard label="Net Margin" value={`${stock.fundamentals.net_margin.toFixed(2)}%`} />
                  )}
                  {stock.fundamentals.fcf_yield != null && (
                    <MetricCard label="FCF Yield" value={`${stock.fundamentals.fcf_yield.toFixed(2)}%`} />
                  )}
                </div>
              </div>

              {/* Financial Health */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Financial Health
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stock.fundamentals.debt_equity != null && (
                    <MetricCard label="Debt/Equity" value={stock.fundamentals.debt_equity.toFixed(2)} />
                  )}
                  {stock.fundamentals.current_ratio != null && (
                    <MetricCard label="Current Ratio" value={stock.fundamentals.current_ratio.toFixed(2)} />
                  )}
                  {stock.fundamentals.interest_coverage != null && (
                    <MetricCard label="Interest Coverage" value={stock.fundamentals.interest_coverage.toFixed(2)} />
                  )}
                </div>
              </div>

              {/* Growth & Dividends */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Growth & Dividends
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stock.fundamentals.revenue_growth != null && (
                    <MetricCard label="Revenue Growth" value={`${stock.fundamentals.revenue_growth.toFixed(2)}%`} />
                  )}
                  {stock.fundamentals.earnings_growth != null && (
                    <MetricCard label="Earnings Growth" value={`${stock.fundamentals.earnings_growth.toFixed(2)}%`} />
                  )}
                  {stock.fundamentals.dividend_yield != null && (
                    <MetricCard label="Dividend Yield" value={`${stock.fundamentals.dividend_yield.toFixed(2)}%`} />
                  )}
                  {stock.fundamentals.payout_ratio != null && (
                    <MetricCard label="Payout Ratio" value={`${stock.fundamentals.payout_ratio.toFixed(2)}%`} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Score Analysis Tab */}
          {activeTab === 'score' && (
            <div className="space-y-6">
              <ScoreBreakdown breakdown={scoreBreakdown} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Helper component for metric display
function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-lg font-semibold">{value}</p>
    </div>
  );
}
