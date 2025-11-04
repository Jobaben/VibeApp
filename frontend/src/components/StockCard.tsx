import type { Stock } from '../types/stock';
import AddToWatchlistButton from './AddToWatchlistButton';

interface StockCardProps {
  stock: Stock;
  onClick?: (stock: Stock) => void;
}

export function StockCard({ stock, onClick }: StockCardProps) {
  const formatMarketCap = (marketCap?: number): string => {
    if (!marketCap) return 'N/A';

    if (marketCap >= 1e12) {
      return `${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(2)}M`;
    }
    return marketCap.toLocaleString();
  };

  const handleClick = () => {
    if (onClick) {
      onClick(stock);
    }
  };

  // Gradient color based on sector
  const getSectorGradient = (sector?: string) => {
    const gradients: Record<string, string> = {
      'Technology': 'from-blue-500/20 to-cyan-500/20',
      'Financial Services': 'from-green-500/20 to-emerald-500/20',
      'Industrials': 'from-orange-500/20 to-amber-500/20',
      'Consumer Cyclical': 'from-purple-500/20 to-pink-500/20',
      'Healthcare': 'from-red-500/20 to-rose-500/20',
      'Communication': 'from-indigo-500/20 to-violet-500/20',
    };
    return gradients[sector || ''] || 'from-gray-500/20 to-slate-500/20';
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-2xl bg-gradient-to-br ${getSectorGradient(stock.sector)} backdrop-blur-sm
        border border-white/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-white/30
        hover:shadow-2xl hover:shadow-blue-500/10 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gray-900/60 backdrop-blur-xl -z-10"></div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-cyan-500/0
        group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-cyan-500/5 transition-all duration-500 -z-10"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-white">{stock.ticker}</h3>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{stock.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <AddToWatchlistButton ticker={stock.ticker} />
          <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm">
            {stock.instrument_type}
          </span>
        </div>
      </div>

      {/* Sector & Industry */}
      {(stock.sector || stock.industry) && (
        <div className="mb-4 space-y-2 p-3 rounded-xl bg-black/20 border border-white/5">
          {stock.sector && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-gray-400 font-medium">Sector:</span>
              <span className="text-cyan-300 font-medium">{stock.sector}</span>
            </div>
          )}
          {stock.industry && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-gray-400 font-medium">Industry:</span>
              <span className="text-purple-300">{stock.industry}</span>
            </div>
          )}
        </div>
      )}

      {/* Market Cap & Exchange */}
      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            Market Cap
          </p>
          <p className="text-base font-bold text-white">
            {stock.currency} {formatMarketCap(stock.market_cap)}
          </p>
        </div>
        {stock.exchange && (
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1 flex items-center justify-end gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Exchange
            </p>
            <p className="text-sm font-bold text-white">{stock.exchange}</p>
          </div>
        )}
      </div>

      {/* ISIN (if available) */}
      {stock.isin && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            ISIN: <span className="text-gray-400 font-mono">{stock.isin}</span>
          </p>
        </div>
      )}
    </div>
  );
}
