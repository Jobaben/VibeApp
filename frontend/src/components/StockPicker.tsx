import { useState, useEffect, useCallback, useRef } from 'react';
import { stockApi } from '../services/api';
import type { Stock } from '../types/stock';

interface StockPickerProps {
  /** Called with the selected stock when the user picks one from the dropdown. */
  onSelect: (stock: Stock) => void;
  placeholder?: string;
  /** Tickers that are already selected (shown as disabled in the dropdown). */
  disabledTickers?: string[];
  autoFocus?: boolean;
}

/**
 * Autocomplete search box that resolves a query to a concrete stock and hands the
 * full Stock back to the parent. Used by the Compare and Portfolio pages where the
 * caller needs the picked instrument rather than just a free-text query.
 */
export default function StockPicker({
  onSelect,
  placeholder = 'Search by ticker or name to add...',
  disabledTickers = [],
  autoFocus = false,
}: StockPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const found = await stockApi.searchStocks({ q: searchQuery, limit: 10 });
      setResults(found);
      setShowDropdown(true);
    } catch (err) {
      console.error('Stock search error:', err);
      setResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePick = (stock: Stock) => {
    if (disabledTickers.includes(stock.ticker)) return;
    onSelect(stock);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="block w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-white/10 rounded-xl
            text-white placeholder-gray-500
            focus:bg-gray-800/70 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
            backdrop-blur-sm transition-all duration-200"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <div className="animate-spin h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-30 mt-2 w-full bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 max-h-80 overflow-y-auto">
          <div className="py-2">
            {results.map((stock) => {
              const isDisabled = disabledTickers.includes(stock.ticker);
              return (
                <button
                  key={stock.id}
                  onClick={() => handlePick(stock)}
                  disabled={isDisabled}
                  className={`w-full px-4 py-3 text-left border-b border-white/5 last:border-b-0 transition-all duration-200 group
                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">{stock.ticker}</span>
                        {isDisabled && <span className="text-xs text-gray-500">(already added)</span>}
                      </div>
                      <div className="text-sm text-gray-300">{stock.name}</div>
                    </div>
                    {stock.sector && <span className="text-xs text-gray-500">{stock.sector}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showDropdown && !isSearching && results.length === 0 && query.trim() && (
        <div className="absolute z-30 mt-2 w-full bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 py-6 px-4 text-center">
          <p className="text-gray-400 text-sm">No stocks found matching "{query}"</p>
        </div>
      )}
    </div>
  );
}
