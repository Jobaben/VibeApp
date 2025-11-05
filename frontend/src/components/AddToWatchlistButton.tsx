import React, { useState, useRef, useEffect } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';

interface AddToWatchlistButtonProps {
  ticker: string;
  variant?: 'default' | 'icon' | 'compact';
  className?: string;
}

export default function AddToWatchlistButton({
  ticker,
  variant = 'default',
  className = ''
}: AddToWatchlistButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNewWatchlistInput, setShowNewWatchlistInput] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    watchlists,
    addToWatchlist,
    removeFromWatchlist,
    createWatchlist,
    isInWatchlist,
  } = useWatchlist();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNewWatchlistInput(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggleWatchlist = (watchlistId: string) => {
    if (isInWatchlist(ticker, watchlistId)) {
      removeFromWatchlist(watchlistId, ticker);
    } else {
      addToWatchlist(watchlistId, ticker);
    }
  };

  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlistName.trim()) {
      const newWatchlist = createWatchlist(newWatchlistName.trim());
      addToWatchlist(newWatchlist.id, ticker);
      setNewWatchlistName('');
      setShowNewWatchlistInput(false);
    }
  };

  const isInAnyWatchlist = isInWatchlist(ticker);

  // Render based on variant
  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-lg transition-colors ${
            isInAnyWatchlist
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${className}`}
          title={isInAnyWatchlist ? 'In watchlist' : 'Add to watchlist'}
        >
          {isInAnyWatchlist ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
        </button>
      );
    }

    if (variant === 'compact') {
      return (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            isInAnyWatchlist
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          } ${className}`}
        >
          {isInAnyWatchlist ? 'Watching' : 'Watch'}
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isInAnyWatchlist
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        {isInAnyWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
      </button>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {renderButton()}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Add to Watchlist
            </div>

            {watchlists.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No watchlists yet
              </div>
            ) : (
              <div className="space-y-1">
                {watchlists.map((watchlist) => {
                  const isInList = isInWatchlist(ticker, watchlist.id);
                  return (
                    <button
                      key={watchlist.id}
                      onClick={() => handleToggleWatchlist(watchlist.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-gray-700">{watchlist.name}</span>
                        <span className="text-xs text-gray-400">
                          ({watchlist.tickers.length})
                        </span>
                      </span>
                      {isInList && (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-gray-200 mt-2 pt-2">
              {showNewWatchlistInput ? (
                <form onSubmit={handleCreateWatchlist} className="px-2">
                  <input
                    type="text"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    placeholder="Watchlist name..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewWatchlistInput(false);
                        setNewWatchlistName('');
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewWatchlistInput(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Watchlist
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
