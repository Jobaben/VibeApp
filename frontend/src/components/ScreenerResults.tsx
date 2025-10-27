import { useState, useMemo } from 'react';
import type { ScreenerResponse, Signal } from '../types/stock';

interface ScreenerResultsProps {
  response: ScreenerResponse;
  strategyName: string;
  onBack: () => void;
}

type SortField = 'ticker' | 'name' | 'sector' | 'total_score' | 'pe_ratio' | 'roic' | 'dividend_yield';
type SortOrder = 'asc' | 'desc';

// Signal colors and labels
const SIGNAL_CONFIG: Record<Signal, { color: string; bgColor: string; label: string }> = {
  STRONG_BUY: { color: 'text-green-400', bgColor: 'bg-green-900/30 border-green-500/50', label: 'Strong Buy' },
  BUY: { color: 'text-green-300', bgColor: 'bg-green-900/20 border-green-500/30', label: 'Buy' },
  HOLD: { color: 'text-yellow-300', bgColor: 'bg-yellow-900/20 border-yellow-500/30', label: 'Hold' },
  SELL: { color: 'text-red-300', bgColor: 'bg-red-900/20 border-red-500/30', label: 'Sell' },
  STRONG_SELL: { color: 'text-red-400', bgColor: 'bg-red-900/30 border-red-500/50', label: 'Strong Sell' },
};

export default function ScreenerResults({ response, strategyName, onBack }: ScreenerResultsProps) {
  const [sortField, setSortField] = useState<SortField>('total_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...response.results].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'ticker':
        case 'name':
        case 'sector':
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
          break;
        case 'total_score':
          aValue = a.scores?.total_score || 0;
          bValue = b.scores?.total_score || 0;
          break;
        case 'pe_ratio':
        case 'roic':
        case 'dividend_yield':
          aValue = a.fundamentals?.[sortField] || 0;
          bValue = b.fundamentals?.[sortField] || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [response.results, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatNumber = (value: number | undefined, decimals: number = 2): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  const formatPercent = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Strategies
          </button>
          <h2 className="text-3xl font-bold text-white mb-1">
            {response.strategy_name || strategyName}
          </h2>
          <p className="text-gray-400">{response.criteria}</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-purple-400">
            {response.total_matches}
          </div>
          <div className="text-sm text-gray-500">stocks found</div>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('ticker')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                  >
                    Ticker
                    <SortIcon field="ticker" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                  >
                    Name
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('sector')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                  >
                    Sector
                    <SortIcon field="sector" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort('total_score')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors mx-auto"
                  >
                    Score
                    <SortIcon field="total_score" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">Signal</th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('pe_ratio')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors ml-auto"
                  >
                    P/E
                    <SortIcon field="pe_ratio" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('roic')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors ml-auto"
                  >
                    ROIC
                    <SortIcon field="roic" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((stock) => {
                const signalConfig = stock.scores?.signal ? SIGNAL_CONFIG[stock.scores.signal] : null;
                const isExpanded = expandedRow === stock.id;

                return (
                  <>
                    <tr
                      key={stock.id}
                      className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors cursor-pointer"
                      onClick={() => toggleRow(stock.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-white">{stock.ticker}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{stock.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{stock.sector || 'N/A'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-purple-400">
                          {formatNumber(stock.scores?.total_score, 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {signalConfig && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${signalConfig.color} ${signalConfig.bgColor}`}>
                            {signalConfig.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatNumber(stock.fundamentals?.pe_ratio)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatPercent(stock.fundamentals?.roic)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <svg
                          className={`w-5 h-5 mx-auto text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-900/40 border-b border-gray-700/30">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strengths */}
                            {stock.strengths && stock.strengths.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-green-400 mb-2">✓ Strengths</h4>
                                <ul className="space-y-1">
                                  {stock.strengths.map((strength, idx) => (
                                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                      <span className="text-green-500 mt-0.5">•</span>
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Weaknesses */}
                            {stock.weaknesses && stock.weaknesses.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-red-400 mb-2">⚠ Weaknesses</h4>
                                <ul className="space-y-1">
                                  {stock.weaknesses.map((weakness, idx) => (
                                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                      <span className="text-red-500 mt-0.5">•</span>
                                      <span>{weakness}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Key Metrics */}
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-semibold text-purple-400 mb-2">📊 Key Metrics</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-gray-800/50 rounded p-2">
                                  <div className="text-xs text-gray-500">P/E Ratio</div>
                                  <div className="text-sm font-semibold text-white">{formatNumber(stock.fundamentals?.pe_ratio)}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded p-2">
                                  <div className="text-xs text-gray-500">ROIC</div>
                                  <div className="text-sm font-semibold text-white">{formatPercent(stock.fundamentals?.roic)}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded p-2">
                                  <div className="text-xs text-gray-500">ROE</div>
                                  <div className="text-sm font-semibold text-white">{formatPercent(stock.fundamentals?.roe)}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded p-2">
                                  <div className="text-xs text-gray-500">Debt/Equity</div>
                                  <div className="text-sm font-semibold text-white">{formatNumber(stock.fundamentals?.debt_equity)}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded p-2">
                                  <div className="text-xs text-gray-500">Net Margin</div>
                                  <div className="text-sm font-semibold text-white">{formatPercent(stock.fundamentals?.net_margin)}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded p-2">
                                  <div className="text-xs text-gray-500">Revenue Growth</div>
                                  <div className="text-sm font-semibold text-white">{formatPercent(stock.fundamentals?.revenue_growth)}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded p-2">
                                  <div className="text-xs text-gray-500">Dividend Yield</div>
                                  <div className="text-sm font-semibold text-white">{formatPercent(stock.fundamentals?.dividend_yield)}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded p-2">
                                  <div className="text-xs text-gray-500">FCF Yield</div>
                                  <div className="text-sm font-semibold text-white">{formatPercent(stock.fundamentals?.fcf_yield)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {response.results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No stocks found matching this strategy.
          </div>
        )}
      </div>
    </div>
  );
}
