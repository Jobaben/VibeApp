import { useEffect, useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';

interface ScoreChange {
  total_score: number;
  value_score: number;
  quality_score: number;
  momentum_score: number;
  health_score: number;
  signal_changed: boolean;
}

interface ScoreChangeData {
  ticker: string;
  period_days: number;
  current: {
    total_score: number;
    signal: string;
  };
  historical: {
    date: string;
    total_score: number;
    signal: string;
  };
  changes: ScoreChange;
  percent_change: number;
}

interface ScoreChangeIndicatorProps {
  ticker: string;
  days?: number;
  variant?: 'default' | 'compact' | 'detailed';
  showPercentage?: boolean;
}

export function ScoreChangeIndicator({
  ticker,
  days = 7,
  variant = 'default',
  showPercentage = true
}: ScoreChangeIndicatorProps) {
  const [changeData, setChangeData] = useState<ScoreChangeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScoreChange = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:8000/api/stocks/${ticker}/score-change?days=${days}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('No historical data');
            setChangeData(null);
            return;
          }
          throw new Error('Failed to fetch score change');
        }

        const data = await response.json();
        setChangeData(data);
      } catch (err) {
        console.error('Error fetching score change:', err);
        setError('Failed to load');
        setChangeData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchScoreChange();
  }, [ticker, days]);

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <div className="h-4 w-4 animate-pulse bg-gray-600 rounded"></div>
        <div className="h-3 w-12 animate-pulse bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (error || !changeData) {
    return variant === 'compact' ? null : (
      <span className="text-xs text-gray-500">{error || 'N/A'}</span>
    );
  }

  const change = changeData.changes.total_score;
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.5;

  const getChangeColor = () => {
    if (isNeutral) return 'text-gray-400';
    return isPositive ? 'text-green-400' : 'text-red-400';
  };

  const getChangeBgColor = () => {
    if (isNeutral) return 'bg-gray-500/20';
    return isPositive ? 'bg-green-500/20' : 'bg-red-500/20';
  };

  const getChangeIcon = () => {
    if (isNeutral) return <MinusIcon className="h-3 w-3" />;
    return isPositive ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />;
  };

  // Compact variant - just icon and change
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${getChangeColor()}`}>
        {getChangeIcon()}
        <span className="text-xs font-medium">
          {isPositive && '+'}{change.toFixed(1)}
        </span>
      </div>
    );
  }

  // Detailed variant - show component changes
  if (variant === 'detailed') {
    return (
      <div className="space-y-2">
        {/* Total Score Change */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Total Score ({days}d)</span>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${getChangeBgColor()} ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="text-sm font-semibold">
              {isPositive && '+'}{change.toFixed(1)}
            </span>
            {showPercentage && (
              <span className="text-xs">
                ({isPositive && '+'}{changeData.percent_change.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        {/* Signal Change Badge */}
        {changeData.changes.signal_changed && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Signal:</span>
            <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300">
              {changeData.historical.signal}
            </span>
            <span className="text-gray-500">→</span>
            <span className={`px-2 py-0.5 rounded ${
              changeData.current.signal.includes('BUY')
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {changeData.current.signal}
            </span>
          </div>
        )}

        {/* Component Scores */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <ScoreComponentChange label="Value" change={changeData.changes.value_score} />
          <ScoreComponentChange label="Quality" change={changeData.changes.quality_score} />
          <ScoreComponentChange label="Momentum" change={changeData.changes.momentum_score} />
          <ScoreComponentChange label="Health" change={changeData.changes.health_score} />
        </div>
      </div>
    );
  }

  // Default variant - badge with change
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${getChangeBgColor()} ${getChangeColor()}`}
      title={`Score change over ${days} days`}
    >
      {getChangeIcon()}
      <span className="text-sm font-medium">
        {isPositive && '+'}{change.toFixed(1)}
      </span>
      {showPercentage && (
        <span className="text-xs opacity-80">
          ({isPositive && '+'}{changeData.percent_change.toFixed(1)}%)
        </span>
      )}
      <span className="text-xs opacity-60">{days}d</span>
    </div>
  );
}

// Helper component for individual score components
function ScoreComponentChange({ label, change }: { label: string; change: number }) {
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.1;

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${
        isNeutral ? 'text-gray-400' : isPositive ? 'text-green-400' : 'text-red-400'
      }`}>
        {isPositive && '+'}{change.toFixed(1)}
      </span>
    </div>
  );
}

export default ScoreChangeIndicator;
