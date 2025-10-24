import { useState, useEffect, useCallback } from 'react';
import { stockApi } from '../services/api';
import type { Stock } from '../types/stock';

interface StockSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function StockSearch({ onSearch, placeholder = 'Search stocks by ticker or name...' }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      onSearch('');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await stockApi.searchStocks({ q: searchQuery, limit: 10 });
      setSearchResults(results);
      setShowDropdown(results.length > 0);
      onSearch(searchQuery);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search stocks');
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch]);

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSelectStock = (stock: Stock) => {
    setQuery(stock.ticker);
    setShowDropdown(false);
    onSearch(stock.ticker);
  };

  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setError(null);
    onSearch('');
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        {isSearching && (
          <div className="absolute inset-y-0 right-10 pr-3 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search results dropdown */}
      {showDropdown && searchResults.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <div className="py-2">
            {searchResults.map((stock) => (
              <button
                key={stock.id}
                onClick={() => handleSelectStock(stock)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{stock.ticker}</div>
                    <div className="text-sm text-gray-600 mt-1">{stock.name}</div>
                    {stock.sector && (
                      <div className="text-xs text-gray-500 mt-1">{stock.sector}</div>
                    )}
                  </div>
                  <span className="ml-3 px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700">
                    {stock.instrument_type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {showDropdown && searchResults.length === 0 && query.trim() && !isSearching && (
        <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-4 px-4 text-center text-gray-500">
          No stocks found matching "{query}"
        </div>
      )}
    </div>
  );
}
