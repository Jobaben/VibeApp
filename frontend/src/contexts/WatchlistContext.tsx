import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Watchlist } from '../types/stock';

interface WatchlistContextType {
  watchlists: Watchlist[];
  createWatchlist: (name: string, description?: string) => void;
  deleteWatchlist: (id: string) => void;
  renameWatchlist: (id: string, name: string, description?: string) => void;
  addToWatchlist: (watchlistId: string, ticker: string) => void;
  removeFromWatchlist: (watchlistId: string, ticker: string) => void;
  isInWatchlist: (ticker: string) => boolean;
  getWatchlistsForStock: (ticker: string) => Watchlist[];
  loading: boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

const STORAGE_KEY = 'avanza_watchlists';

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Load watchlists from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWatchlists(parsed);
      } else {
        // Create a default watchlist if none exist
        const defaultWatchlist: Watchlist = {
          id: generateId(),
          name: 'My Watchlist',
          description: 'Default watchlist',
          tickers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setWatchlists([defaultWatchlist]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultWatchlist]));
      }
    } catch (error) {
      console.error('Error loading watchlists from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save watchlists to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
      } catch (error) {
        console.error('Error saving watchlists to localStorage:', error);
      }
    }
  }, [watchlists, loading]);

  const generateId = (): string => {
    return `wl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createWatchlist = (name: string, description?: string) => {
    const newWatchlist: Watchlist = {
      id: generateId(),
      name,
      description,
      tickers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWatchlists((prev) => [...prev, newWatchlist]);
  };

  const deleteWatchlist = (id: string) => {
    setWatchlists((prev) => prev.filter((wl) => wl.id !== id));
  };

  const renameWatchlist = (id: string, name: string, description?: string) => {
    setWatchlists((prev) =>
      prev.map((wl) =>
        wl.id === id
          ? { ...wl, name, description, updatedAt: new Date().toISOString() }
          : wl
      )
    );
  };

  const addToWatchlist = (watchlistId: string, ticker: string) => {
    setWatchlists((prev) =>
      prev.map((wl) => {
        if (wl.id === watchlistId && !wl.tickers.includes(ticker)) {
          return {
            ...wl,
            tickers: [...wl.tickers, ticker],
            updatedAt: new Date().toISOString(),
          };
        }
        return wl;
      })
    );
  };

  const removeFromWatchlist = (watchlistId: string, ticker: string) => {
    setWatchlists((prev) =>
      prev.map((wl) => {
        if (wl.id === watchlistId) {
          return {
            ...wl,
            tickers: wl.tickers.filter((t) => t !== ticker),
            updatedAt: new Date().toISOString(),
          };
        }
        return wl;
      })
    );
  };

  const isInWatchlist = (ticker: string): boolean => {
    return watchlists.some((wl) => wl.tickers.includes(ticker));
  };

  const getWatchlistsForStock = (ticker: string): Watchlist[] => {
    return watchlists.filter((wl) => wl.tickers.includes(ticker));
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlists,
        createWatchlist,
        deleteWatchlist,
        renameWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        getWatchlistsForStock,
        loading,
      }}
    >
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
