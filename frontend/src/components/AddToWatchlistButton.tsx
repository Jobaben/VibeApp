import { useState } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';

interface AddToWatchlistButtonProps {
  ticker: string;
  className?: string;
  variant?: 'icon' | 'button';
}

export default function AddToWatchlistButton({ ticker, className = '', variant = 'icon' }: AddToWatchlistButtonProps) {
  const { watchlists, addToWatchlist, removeFromWatchlist, isInWatchlist, getWatchlistsForStock } = useWatchlist();
  const [showMenu, setShowMenu] = useState(false);

  const isWatched = isInWatchlist(ticker);
  const stockWatchlists = getWatchlistsForStock(ticker);

  const handleToggleWatchlist = (watchlistId: string, isCurrentlyInList: boolean) => {
    if (isCurrentlyInList) {
      removeFromWatchlist(watchlistId, ticker);
    } else {
      addToWatchlist(watchlistId, ticker);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isWatched) {
      // Remove from all watchlists
      stockWatchlists.forEach((wl) => removeFromWatchlist(wl.id, ticker));
    } else {
      // Add to first watchlist
      if (watchlists.length > 0) {
        addToWatchlist(watchlists[0].id, ticker);
      }
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  if (variant === 'button') {
    return (
      <div className="relative">
        <button
          onClick={handleMenuClick}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            isWatched
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } ${className}`}
        >
          {isWatched ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Watching
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Add to Watchlist
            </>
          )}
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="p-2">
                <p className="text-xs text-gray-400 px-2 py-1 font-medium">Select watchlists</p>
                {watchlists.map((wl) => {
                  const isInList = wl.tickers.includes(ticker);
                  return (
                    <button
                      key={wl.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWatchlist(wl.id, isInList);
                      }}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isInList ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                      }`}>
                        {isInList && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{wl.name}</p>
                        <p className="text-xs text-gray-500">{wl.tickers.length} stocks</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Icon variant (default)
  return (
    <div className="relative">
      <button
        onClick={watchlists.length > 1 ? handleMenuClick : handleQuickAdd}
        className={`p-2 rounded-lg transition-all ${
          isWatched
            ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        } ${className}`}
        title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {isWatched ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu for icon variant with multiple watchlists */}
      {showMenu && watchlists.length > 1 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2">
              <p className="text-xs text-gray-400 px-2 py-1 font-medium">Select watchlists</p>
              {watchlists.map((wl) => {
                const isInList = wl.tickers.includes(ticker);
                return (
                  <button
                    key={wl.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleWatchlist(wl.id, isInList);
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isInList ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                    }`}>
                      {isInList && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{wl.name}</p>
                      <p className="text-xs text-gray-500">{wl.tickers.length} stocks</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
