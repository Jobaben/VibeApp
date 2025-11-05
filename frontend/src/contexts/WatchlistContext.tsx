import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface Watchlist {
  id: string;
  name: string;
  tickers: string[];
  createdAt: string;
  updatedAt: string;
}

interface WatchlistContextType {
  watchlists: Watchlist[];
  createWatchlist: (name: string) => Watchlist;
  deleteWatchlist: (id: string) => void;
  renameWatchlist: (id: string, newName: string) => void;
  addToWatchlist: (watchlistId: string, ticker: string) => void;
  removeFromWatchlist: (watchlistId: string, ticker: string) => void;
  isInWatchlist: (ticker: string, watchlistId?: string) => boolean;
  getWatchlistsForTicker: (ticker: string) => Watchlist[];
  isLoading: boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

const STORAGE_KEY = 'vibeapp_watchlists';

// Default watchlist for new users
const DEFAULT_WATCHLIST: Watchlist = {
  id: 'default',
  name: 'My Watchlist',
  tickers: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load watchlists from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWatchlists(parsed);
      } else {
        // Initialize with default watchlist
        setWatchlists([DEFAULT_WATCHLIST]);
      }
    } catch (error) {
      console.error('Failed to load watchlists from localStorage:', error);
      setWatchlists([DEFAULT_WATCHLIST]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save watchlists to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
      } catch (error) {
        console.error('Failed to save watchlists to localStorage:', error);
      }
    }
  }, [watchlists, isLoading]);

  const createWatchlist = (name: string): Watchlist => {
    const newWatchlist: Watchlist = {
      id: `watchlist_${Date.now()}`,
      name,
      tickers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWatchlists((prev) => [...prev, newWatchlist]);
    return newWatchlist;
  };

  const deleteWatchlist = (id: string) => {
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
  };

  const renameWatchlist = (id: string, newName: string) => {
    setWatchlists((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, name: newName, updatedAt: new Date().toISOString() }
          : w
      )
    );
  };

  const addToWatchlist = (watchlistId: string, ticker: string) => {
    setWatchlists((prev) =>
      prev.map((w) => {
        if (w.id === watchlistId && !w.tickers.includes(ticker)) {
          return {
            ...w,
            tickers: [...w.tickers, ticker],
            updatedAt: new Date().toISOString(),
          };
        }
        return w;
      })
    );
  };

  const removeFromWatchlist = (watchlistId: string, ticker: string) => {
    setWatchlists((prev) =>
      prev.map((w) => {
        if (w.id === watchlistId) {
          return {
            ...w,
            tickers: w.tickers.filter((t) => t !== ticker),
            updatedAt: new Date().toISOString(),
          };
        }
        return w;
      })
    );
  };

  const isInWatchlist = (ticker: string, watchlistId?: string): boolean => {
    if (watchlistId) {
      const watchlist = watchlists.find((w) => w.id === watchlistId);
      return watchlist ? watchlist.tickers.includes(ticker) : false;
    }
    // Check if ticker is in any watchlist
    return watchlists.some((w) => w.tickers.includes(ticker));
  };

  const getWatchlistsForTicker = (ticker: string): Watchlist[] => {
    return watchlists.filter((w) => w.tickers.includes(ticker));
  };

  const value: WatchlistContextType = {
    watchlists,
    createWatchlist,
    deleteWatchlist,
    renameWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    getWatchlistsForTicker,
    isLoading,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
