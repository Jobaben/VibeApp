import { Link } from 'react-router-dom';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/solid';
import type { SignalChangeStock } from '../types/stock';

interface SignalChangeCardProps {
  stock: SignalChangeStock;
}

export function SignalChangeCard({ stock }: SignalChangeCardProps) {
  const getSignalColor = (signal: string) => {
    if (signal.includes('STRONG_BUY')) return 'bg-green-600 text-white';
    if (signal.includes('BUY')) return 'bg-green-500 text-white';
    if (signal.includes('HOLD')) return 'bg-yellow-500 text-gray-900';
    if (signal.includes('SELL')) return 'bg-red-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const getSignalChangeType = () => {
    const prev = stock.previous_signal;
    const curr = stock.current_signal;

    // Upgrade signals
    if ((prev === 'HOLD' || prev === 'SELL') && (curr === 'BUY' || curr === 'STRONG_BUY')) {
      return { type: 'upgrade', color: 'border-green-500/30 bg-green-500/5' };
    }
    if (prev === 'BUY' && curr === 'STRONG_BUY') {
      return { type: 'upgrade', color: 'border-green-500/30 bg-green-500/5' };
    }

    // Downgrade signals
    if ((prev === 'BUY' || prev === 'STRONG_BUY') && (curr === 'HOLD' || curr === 'SELL')) {
      return { type: 'downgrade', color: 'border-red-500/30 bg-red-500/5' };
    }
    if (prev === 'STRONG_BUY' && curr === 'BUY') {
      return { type: 'downgrade', color: 'border-red-500/30 bg-red-500/5' };
    }

    // Neutral/other changes
    return { type: 'change', color: 'border-blue-500/30 bg-blue-500/5' };
  };

  const changeType = getSignalChangeType();

  return (
    <Link
      to={`/stock/${stock.ticker}`}
      className={`block p-4 rounded-lg border ${changeType.color} hover:bg-opacity-20 transition-all duration-200 hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Stock Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-white text-lg">{stock.ticker}</h3>
              <p className="text-sm text-gray-400 truncate">{stock.name}</p>
            </div>
            {changeType.type === 'upgrade' && (
              <div className="flex-shrink-0">
                <SparklesIcon className="h-5 w-5 text-green-400" />
              </div>
            )}
          </div>

          {/* Sector & Score */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
              {stock.sector}
            </span>
            <span className="text-sm text-gray-400">
              Score: <span className="font-semibold text-white">{stock.current_score.toFixed(1)}</span>
            </span>
          </div>

          {/* Signal Change */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-500 mb-1">Previous</div>
              <span className={`inline-block px-3 py-1.5 rounded text-sm font-medium ${getSignalColor(stock.previous_signal)}`}>
                {stock.previous_signal.replace('_', ' ')}
              </span>
            </div>

            <div className="flex-shrink-0">
              <ArrowRightIcon className={`h-5 w-5 ${
                changeType.type === 'upgrade' ? 'text-green-400' :
                changeType.type === 'downgrade' ? 'text-red-400' :
                'text-blue-400'
              }`} />
            </div>

            <div className="flex-1 text-center">
              <div className="text-xs text-gray-500 mb-1">Current</div>
              <span className={`inline-block px-3 py-1.5 rounded text-sm font-medium ${getSignalColor(stock.current_signal)}`}>
                {stock.current_signal.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Time Info */}
          <div className="mt-3 text-xs text-gray-500 text-center">
            Changed {stock.days_ago} day{stock.days_ago !== 1 ? 's' : ''} ago
            {stock.signal_change_date && (
              <> on {new Date(stock.signal_change_date).toLocaleDateString()}</>
            )}
          </div>

          {/* Change Type Badge */}
          {changeType.type === 'upgrade' && (
            <div className="mt-2 text-center">
              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                🚀 Upgraded
              </span>
            </div>
          )}
          {changeType.type === 'downgrade' && (
            <div className="mt-2 text-center">
              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                ⚠️ Downgraded
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default SignalChangeCard;
