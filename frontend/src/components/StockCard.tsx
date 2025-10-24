import type { Stock } from '../types/stock';

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

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 transition-all hover:shadow-lg hover:border-blue-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{stock.ticker}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{stock.name}</p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {stock.instrument_type}
        </span>
      </div>

      {/* Sector & Industry */}
      {(stock.sector || stock.industry) && (
        <div className="mb-4 space-y-1">
          {stock.sector && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 font-medium">Sector:</span>
              <span className="ml-2 text-gray-900">{stock.sector}</span>
            </div>
          )}
          {stock.industry && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 font-medium">Industry:</span>
              <span className="ml-2 text-gray-900">{stock.industry}</span>
            </div>
          )}
        </div>
      )}

      {/* Market Cap & Exchange */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Market Cap</p>
          <p className="text-sm font-semibold text-gray-900">
            {stock.currency} {formatMarketCap(stock.market_cap)}
          </p>
        </div>
        {stock.exchange && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Exchange</p>
            <p className="text-sm font-semibold text-gray-900">{stock.exchange}</p>
          </div>
        )}
      </div>

      {/* ISIN (if available) */}
      {stock.isin && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">ISIN: {stock.isin}</p>
        </div>
      )}
    </div>
  );
}
