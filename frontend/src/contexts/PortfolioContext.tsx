import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// A single portfolio holding. Prices are stored in the instrument's own currency
// and are entered by the user (this app has no brokerage account linkage).
export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  avgPrice: number;
  addedAt: string;
}

interface PortfolioContextType {
  holdings: Holding[];
  addHolding: (holding: Omit<Holding, 'addedAt'>) => void;
  updateHolding: (ticker: string, shares: number, avgPrice: number) => void;
  removeHolding: (ticker: string) => void;
  hasHolding: (ticker: string) => boolean;
  isLoading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const STORAGE_KEY = 'vibeapp_portfolio';

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHoldings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load portfolio from localStorage:', error);
      setHoldings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist whenever holdings change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
      } catch (error) {
        console.error('Failed to save portfolio to localStorage:', error);
      }
    }
  }, [holdings, isLoading]);

  const addHolding = (holding: Omit<Holding, 'addedAt'>) => {
    setHoldings((prev) => {
      const existing = prev.find((h) => h.ticker === holding.ticker);
      if (existing) {
        // Merge into a combined position with a weighted-average cost basis.
        const totalShares = existing.shares + holding.shares;
        const totalCost = existing.shares * existing.avgPrice + holding.shares * holding.avgPrice;
        const avgPrice = totalShares > 0 ? totalCost / totalShares : 0;
        return prev.map((h) =>
          h.ticker === holding.ticker ? { ...h, shares: totalShares, avgPrice } : h
        );
      }
      return [...prev, { ...holding, addedAt: new Date().toISOString() }];
    });
  };

  const updateHolding = (ticker: string, shares: number, avgPrice: number) => {
    setHoldings((prev) =>
      prev.map((h) => (h.ticker === ticker ? { ...h, shares, avgPrice } : h))
    );
  };

  const removeHolding = (ticker: string) => {
    setHoldings((prev) => prev.filter((h) => h.ticker !== ticker));
  };

  const hasHolding = (ticker: string): boolean => holdings.some((h) => h.ticker === ticker);

  const value: PortfolioContextType = {
    holdings,
    addHolding,
    updateHolding,
    removeHolding,
    hasHolding,
    isLoading,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
