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
      <div className="relative group">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors"
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

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="block w-full pl-12 pr-12 py-4 bg-gray-800/50 border border-white/10 rounded-xl
            text-white placeholder-gray-500
            focus:bg-gray-800/70 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
            backdrop-blur-sm transition-all duration-200"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-400 transition-colors"
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

        {/* Loading Spinner */}
        {isSearching && (
          <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
            <div className="animate-spin h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-400 flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Search results dropdown */}
      {showDropdown && searchResults.length > 0 && (
        <div className="absolute z-20 mt-2 w-full bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/10
          shadow-2xl shadow-black/50 max-h-96 overflow-hidden">
          <div className="py-2 max-h-96 overflow-y-auto">
            {searchResults.map((stock) => (
              <button
                key={stock.id}
                onClick={() => handleSelectStock(stock)}
                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-all duration-200
                  border-b border-white/5 last:border-b-0 group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                        {stock.ticker}
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                    </div>
                    <div className="text-sm text-gray-300">{stock.name}</div>
                    {stock.sector && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        {stock.sector}
                      </div>
                    )}
                  </div>
                  <span className="ml-3 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {stock.instrument_type}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="px-4 py-2 bg-gray-900/50 border-t border-white/10 text-xs text-gray-400 flex items-center justify-between">
            <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</span>
            <span className="text-cyan-400">Press Enter to view all</span>
          </div>
        </div>
      )}

      {/* No results message */}
      {showDropdown && searchResults.length === 0 && query.trim() && !isSearching && (
        <div className="absolute z-20 mt-2 w-full bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/10
          shadow-2xl shadow-black/50 py-8 px-4 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400">No stocks found matching</p>
          <p className="text-white font-semibold mt-1">"{query}"</p>
        </div>
      )}
    </div>
  );
}
