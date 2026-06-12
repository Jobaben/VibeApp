import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StockPicker from '../components/StockPicker';
import { stockApi } from '../services/api';
import { getSignalColor, signalLabel } from '../utils/signal';
import type { Stock, StockDetail } from '../types/stock';

const STORAGE_KEY = 'vibeapp_compare';
const MAX_COMPARE = 4;

interface CompareEntry {
  ticker: string;
  data?: StockDetail;
  isLoading: boolean;
  error?: string;
}

// "higher" => bigger is better, "lower" => smaller is better, "none" => no winner highlight.
type Direction = 'higher' | 'lower' | 'none';
type Source = 'score' | 'fundamental' | 'stock';
type Format = 'ratio' | 'percent' | 'score' | 'marketCap';

interface MetricRow {
  key: string;
  label: string;
  source: Source;
  direction: Direction;
  format: Format;
}

const SCORE_ROWS: MetricRow[] = [
  { key: 'total_score', label: 'Total Score', source: 'score', direction: 'higher', format: 'score' },
  { key: 'value_score', label: 'Value', source: 'score', direction: 'higher', format: 'score' },
  { key: 'quality_score', label: 'Quality', source: 'score', direction: 'higher', format: 'score' },
  { key: 'momentum_score', label: 'Momentum', source: 'score', direction: 'higher', format: 'score' },
  { key: 'health_score', label: 'Financial Health', source: 'score', direction: 'higher', format: 'score' },
];

const FUNDAMENTAL_ROWS: MetricRow[] = [
  { key: 'pe_ratio', label: 'P/E Ratio', source: 'fundamental', direction: 'lower', format: 'ratio' },
  { key: 'peg_ratio', label: 'PEG Ratio', source: 'fundamental', direction: 'lower', format: 'ratio' },
  { key: 'pb_ratio', label: 'P/B Ratio', source: 'fundamental', direction: 'lower', format: 'ratio' },
  { key: 'ev_ebitda', label: 'EV/EBITDA', source: 'fundamental', direction: 'lower', format: 'ratio' },
  { key: 'roic', label: 'ROIC', source: 'fundamental', direction: 'higher', format: 'percent' },
  { key: 'roe', label: 'ROE', source: 'fundamental', direction: 'higher', format: 'percent' },
  { key: 'net_margin', label: 'Net Margin', source: 'fundamental', direction: 'higher', format: 'percent' },
  { key: 'operating_margin', label: 'Operating Margin', source: 'fundamental', direction: 'higher', format: 'percent' },
  { key: 'debt_equity', label: 'Debt / Equity', source: 'fundamental', direction: 'lower', format: 'ratio' },
  { key: 'current_ratio', label: 'Current Ratio', source: 'fundamental', direction: 'higher', format: 'ratio' },
  { key: 'fcf_yield', label: 'FCF Yield', source: 'fundamental', direction: 'higher', format: 'percent' },
  { key: 'dividend_yield', label: 'Dividend Yield', source: 'fundamental', direction: 'higher', format: 'percent' },
  { key: 'revenue_growth', label: 'Revenue Growth', source: 'fundamental', direction: 'higher', format: 'percent' },
  { key: 'market_cap', label: 'Market Cap', source: 'stock', direction: 'none', format: 'marketCap' },
];

/** Read a metric value from a stock detail, coercing to a number (or null if absent). */
function getValue(entry: StockDetail | undefined, row: MetricRow): number | null {
  if (!entry) return null;
  let raw: unknown;
  if (row.source === 'score') raw = entry.scores?.[row.key as keyof typeof entry.scores];
  else if (row.source === 'fundamental') raw = entry.fundamentals?.[row.key as keyof typeof entry.fundamentals];
  else raw = entry[row.key as keyof StockDetail];
  if (raw === null || raw === undefined || raw === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function formatValue(value: number | null, format: Format): string {
  if (value === null) return '—';
  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'score':
      return value.toFixed(1);
    case 'marketCap':
      if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
      if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
      return value.toLocaleString();
    case 'ratio':
    default:
      return value.toFixed(2);
  }
}

/** Index of the best column for a row, or -1 if there is no unambiguous winner. */
function bestIndex(values: (number | null)[], direction: Direction): number {
  if (direction === 'none') return -1;
  const present = values.filter((v): v is number => v !== null);
  if (present.length < 2) return -1;
  const target = direction === 'higher' ? Math.max(...present) : Math.min(...present);
  // Only highlight when there is a single, unique winner.
  if (present.filter((v) => v === target).length !== 1) return -1;
  return values.findIndex((v) => v === target);
}

export default function Compare() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<CompareEntry[]>([]);

  // Load saved comparison set
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const tickers: string[] = JSON.parse(stored);
        setEntries(tickers.slice(0, MAX_COMPARE).map((ticker) => ({ ticker, isLoading: true })));
      }
    } catch (error) {
      console.error('Failed to load comparison from localStorage:', error);
    }
  }, []);

  // Persist tickers
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.map((e) => e.ticker)));
  }, [entries]);

  const loadStock = useCallback(async (ticker: string) => {
    try {
      const data = await stockApi.getStockDetail(ticker);
      setEntries((prev) =>
        prev.map((e) => (e.ticker === ticker ? { ...e, data, isLoading: false } : e))
      );
    } catch (error) {
      console.error(`Failed to load ${ticker}:`, error);
      setEntries((prev) =>
        prev.map((e) => (e.ticker === ticker ? { ...e, isLoading: false, error: 'Failed to load' } : e))
      );
    }
  }, []);

  // Fetch any entries that don't yet have data
  useEffect(() => {
    entries.forEach((e) => {
      if (e.isLoading && !e.data && !e.error) {
        loadStock(e.ticker);
      }
    });
  }, [entries, loadStock]);

  const handleAdd = (stock: Stock) => {
    if (entries.some((e) => e.ticker === stock.ticker)) return;
    if (entries.length >= MAX_COMPARE) return;
    setEntries((prev) => [...prev, { ticker: stock.ticker, isLoading: true }]);
  };

  const handleRemove = (ticker: string) => {
    setEntries((prev) => prev.filter((e) => e.ticker !== ticker));
  };

  const handleClearAll = () => setEntries([]);

  const renderRow = (row: MetricRow) => {
    const values = entries.map((e) => getValue(e.data, row));
    const winner = bestIndex(values, row.direction);
    return (
      <tr key={row.key} className="border-t border-white/5">
        <td className="py-3 px-4 text-sm text-gray-400 font-medium sticky left-0 bg-gray-900/80 backdrop-blur-sm">
          {row.label}
        </td>
        {entries.map((e, i) => (
          <td
            key={e.ticker}
            className={`py-3 px-4 text-center text-sm font-semibold whitespace-nowrap ${
              i === winner ? 'text-green-300' : 'text-white'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {formatValue(values[i], row.format)}
              {i === winner && (
                <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          </td>
        ))}
      </tr>
    );
  };

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
          <h1 className="text-4xl font-bold heading-gradient">Compare Stocks</h1>
          <p className="text-gray-400 mt-2">
            Put up to {MAX_COMPARE} stocks side by side. The best value in each row is highlighted in green.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add bar */}
        <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1">
            {entries.length < MAX_COMPARE ? (
              <StockPicker
                onSelect={handleAdd}
                disabledTickers={entries.map((e) => e.ticker)}
                placeholder={`Add a stock to compare (${entries.length}/${MAX_COMPARE})...`}
              />
            ) : (
              <p className="text-sm text-gray-400 px-2">
                Maximum of {MAX_COMPARE} stocks reached. Remove one to add another.
              </p>
            )}
          </div>
          {entries.length > 0 && (
            <button onClick={handleClearAll} className="px-4 py-2 rounded-lg btn-secondary text-sm whitespace-nowrap">
              Clear All
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">No stocks to compare yet</h3>
            <p className="text-gray-400">Use the search box above to add stocks side by side.</p>
          </div>
        ) : (
          <div className="glass-card overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-4 text-left text-xs uppercase tracking-wider text-gray-500 sticky left-0 bg-gray-900/80 backdrop-blur-sm">
                    Metric
                  </th>
                  {entries.map((e) => (
                    <th key={e.ticker} className="py-4 px-4 text-center min-w-[160px]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/stock/${encodeURIComponent(e.ticker)}`}
                            className="text-lg font-bold text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {e.ticker}
                          </Link>
                          <button
                            onClick={() => handleRemove(e.ticker)}
                            className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Remove from comparison"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {e.data && (
                          <span className="text-xs text-gray-400 font-normal line-clamp-1 max-w-[150px]">{e.data.name}</span>
                        )}
                        {e.error ? (
                          <span className="text-xs text-red-400">Failed to load</span>
                        ) : e.isLoading ? (
                          <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${getSignalColor(e.data?.scores?.signal)}`}>
                            {signalLabel(e.data?.scores?.signal)}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={entries.length + 1} className="py-2 px-4 text-xs uppercase tracking-wider text-cyan-400 bg-white/5">
                    Scores (0–25, total 0–100)
                  </td>
                </tr>
                {SCORE_ROWS.map(renderRow)}
                <tr>
                  <td colSpan={entries.length + 1} className="py-2 px-4 text-xs uppercase tracking-wider text-cyan-400 bg-white/5">
                    Fundamentals
                  </td>
                </tr>
                {FUNDAMENTAL_ROWS.map(renderRow)}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
