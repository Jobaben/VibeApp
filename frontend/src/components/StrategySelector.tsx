import { useState } from 'react';
import { stockApi } from '../services/api';
import type { Strategy, ScreenerResponse } from '../types/stock';

interface StrategySelectorProps {
  onStrategySelect: (response: ScreenerResponse, strategyName: string) => void;
}

// Strategy definitions matching backend implementation
const STRATEGIES: Strategy[] = [
  {
    id: 'value-gems',
    name: 'Value Gems',
    emoji: '💎',
    description: 'Undervalued quality companies with strong fundamentals',
    criteria: 'P/E <15 • ROIC >15% • Low Debt <0.5',
    target: 'Long-term value investing',
    apiCall: stockApi.valueGemsStrategy,
  },
  {
    id: 'quality-compounders',
    name: 'Quality Compounders',
    emoji: '🚀',
    description: 'Exceptional wealth-building companies with high returns',
    criteria: 'ROIC >20% • Net Margin >15% • Growing Revenue',
    target: 'Long-term wealth compounding',
    apiCall: stockApi.qualityCompoundersStrategy,
  },
  {
    id: 'dividend-kings',
    name: 'Dividend Kings',
    emoji: '👑',
    description: 'Reliable income stocks with sustainable payouts',
    criteria: 'Dividend Yield >3% • Payout <70% • Healthy Balance Sheet',
    target: 'Income generation + stability',
    apiCall: stockApi.dividendKingsStrategy,
  },
  {
    id: 'deep-value',
    name: 'Deep Value',
    emoji: '🔍',
    description: 'Distressed turnaround opportunities trading below value',
    criteria: 'P/B <2.0 • FCF Yield >3% • D/E <1.0',
    target: 'Contrarian value investing',
    apiCall: stockApi.deepValueStrategy,
  },
  {
    id: 'explosive-growth',
    name: 'Explosive Growth',
    emoji: '⚡',
    description: 'High-growth companies at reasonable valuations',
    criteria: 'Revenue Growth >30% • PEG <2.0 • Positive Margins',
    target: 'Growth at reasonable price (GARP)',
    apiCall: stockApi.explosiveGrowthStrategy,
  },
];

export default function StrategySelector({ onStrategySelect }: StrategySelectorProps) {
  const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStrategyClick = async (strategy: Strategy) => {
    setLoadingStrategy(strategy.id);
    setError(null);

    try {
      const response = await strategy.apiCall(50);
      onStrategySelect(response, strategy.name);
    } catch (err) {
      console.error(`Error loading ${strategy.name} strategy:`, err);
      setError(`Failed to load ${strategy.name} strategy. Please try again.`);
    } finally {
      setLoadingStrategy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Pre-Built Investment Strategies
        </h2>
        <p className="text-gray-400">
          Click a strategy to discover stocks that match proven investment criteria
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Strategy cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STRATEGIES.map((strategy) => (
          <button
            key={strategy.id}
            onClick={() => handleStrategyClick(strategy)}
            disabled={loadingStrategy !== null}
            className={`
              relative group
              bg-gradient-to-br from-gray-800/40 to-gray-900/40
              backdrop-blur-sm border border-gray-700/50
              rounded-xl p-6 text-left
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:border-purple-500/50
              hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${loadingStrategy === strategy.id ? 'ring-2 ring-purple-500' : ''}
            `}
          >
            {/* Loading spinner overlay */}
            {loadingStrategy === strategy.id && (
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-300">Loading...</span>
                </div>
              </div>
            )}

            {/* Emoji badge */}
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {strategy.emoji}
            </div>

            {/* Strategy name */}
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              {strategy.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
              {strategy.description}
            </p>

            {/* Criteria */}
            <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/30">
              <div className="text-xs font-semibold text-purple-400 mb-1">Criteria:</div>
              <div className="text-xs text-gray-300 font-mono">
                {strategy.criteria}
              </div>
            </div>

            {/* Target */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{strategy.target}</span>
            </div>

            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-transparent rounded-xl transition-all duration-300 pointer-events-none"></div>
          </button>
        ))}
      </div>

      {/* Info footer */}
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>
          Each strategy applies rigorous fundamental analysis to find the best opportunities.
          Results update automatically as market data changes.
        </p>
      </div>
    </div>
  );
}
