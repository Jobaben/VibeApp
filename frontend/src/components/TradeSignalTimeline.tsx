import type { TradeSignalsResponse, TradeSignalEvent } from '../types/stock';

interface TradeSignalTimelineProps {
  data: TradeSignalsResponse;
  maxEvents?: number;
}

const INDICATOR_LABELS: Record<TradeSignalEvent['indicator'], string> = {
  GOLDEN_CROSS: 'Golden cross',
  DEATH_CROSS: 'Death cross',
  RSI_RECOVERY: 'RSI oversold recovery',
  RSI_REVERSAL: 'RSI overbought reversal',
};

const stanceStyles: Record<string, string> = {
  BULLISH: 'bg-green-500/15 text-green-400 border-green-500/30',
  BEARISH: 'bg-red-500/15 text-red-400 border-red-500/30',
  NEUTRAL: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
};

/** Timeline of historical buy/sell events plus the current technical outlook. */
export default function TradeSignalTimeline({ data, maxEvents = 8 }: TradeSignalTimelineProps) {
  const events = [...data.signals].reverse().slice(0, maxEvents); // newest first
  const { outlook } = data;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Buy / Sell Signals</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${stanceStyles[outlook.stance] ?? stanceStyles.NEUTRAL}`}>
          {outlook.stance}
        </span>
      </div>

      <p className="text-gray-300 text-sm mb-4">{outlook.summary}</p>

      {events.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No buy/sell signal events fired in this period — the technical picture has been steady.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event, i) => (
            <li key={`${event.date}-${event.indicator}-${i}`} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  event.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {event.type === 'BUY' ? '▲' : '▼'}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium">
                  {event.type} · {INDICATOR_LABELS[event.indicator]}
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {' · '}${event.price.toFixed(2)}
                    {event.strength === 'STRONG' && <span className="ml-1 text-amber-400">· strong</span>}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{event.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Signals are derived from moving-average crossovers and RSI levels. Markers also appear on the price chart.
        Educational only — not financial advice.
      </p>
    </div>
  );
}
