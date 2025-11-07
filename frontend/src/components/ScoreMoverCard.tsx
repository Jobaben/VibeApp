import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import type { ScoreMover } from '../types/stock';

interface ScoreMoverCardProps {
  mover: ScoreMover;
  rank: number;
}

export function ScoreMoverCard({ mover, rank }: ScoreMoverCardProps) {
  const isGainer = mover.change > 0;
  const changeColor = isGainer ? 'text-green-400' : 'text-red-400';
  const changeBgColor = isGainer ? 'bg-green-500/10' : 'bg-red-500/10';
  const changeBorderColor = isGainer ? 'border-green-500/30' : 'border-red-500/30';

  const getSignalColor = (signal: string) => {
    if (signal.includes('STRONG_BUY')) return 'bg-green-600 text-white';
    if (signal.includes('BUY')) return 'bg-green-500 text-white';
    if (signal.includes('HOLD')) return 'bg-yellow-500 text-gray-900';
    if (signal.includes('SELL')) return 'bg-red-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const signalChanged = mover.current_signal !== mover.previous_signal;

  return (
    <Link
      to={`/stock/${mover.ticker}`}
      className={`block p-4 rounded-lg border ${changeBorderColor} ${changeBgColor} hover:bg-opacity-20 transition-all duration-200 hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Rank Badge */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          rank <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'
        }`}>
          #{rank}
        </div>

        {/* Stock Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-white text-lg">{mover.ticker}</h3>
              <p className="text-sm text-gray-400 truncate">{mover.name}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold ${changeColor}`}>
              {isGainer ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
              <span className="text-lg">
                {isGainer && '+'}{mover.change.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Sector Badge */}
          <div className="mb-3">
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
              {mover.sector}
            </span>
          </div>

          {/* Score Comparison */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Previous ({mover.days}d ago)</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-400">{mover.previous_score.toFixed(1)}</span>
                {!signalChanged && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSignalColor(mover.previous_signal)}`}>
                    {mover.previous_signal.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 text-gray-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Current</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{mover.current_score.toFixed(1)}</span>
                {!signalChanged && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSignalColor(mover.current_signal)}`}>
                    {mover.current_signal.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Signal Change Indicator */}
          {signalChanged && (
            <div className="mt-3 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-purple-400 font-medium">Signal Changed:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSignalColor(mover.previous_signal)}`}>
                  {mover.previous_signal.replace('_', ' ')}
                </span>
                <span className="text-gray-500">→</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSignalColor(mover.current_signal)}`}>
                  {mover.current_signal.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          {/* Percentage Change */}
          <div className="mt-3 text-right">
            <span className={`text-sm font-medium ${changeColor}`}>
              {isGainer && '+'}{mover.percent_change.toFixed(1)}% change
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ScoreMoverCard;
