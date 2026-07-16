import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PriceDataPoint, TradeSignalEvent } from '../types/stock';

interface PriceChartProps {
  data: PriceDataPoint[];
  signals?: TradeSignalEvent[];
  showMovingAverages?: boolean;
  height?: number;
}

// Day-precision key so signal events line up with their price bar regardless
// of the time component in either timestamp.
const dayKey = (date: string) => date.slice(0, 10);

// Triangle markers for buy (pointing up, green) and sell (pointing down, red).
const BuyMarker = (props: any) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <polygon points={`${cx},${cy - 7} ${cx - 6},${cy + 5} ${cx + 6},${cy + 5}`} fill="#10B981" stroke="#064E3B" strokeWidth={1} />;
};

const SellMarker = (props: any) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <polygon points={`${cx},${cy + 7} ${cx - 6},${cy - 5} ${cx + 6},${cy - 5}`} fill="#EF4444" stroke="#7F1D1D" strokeWidth={1} />;
};

export default function PriceChart({ data, signals, showMovingAverages = true, height = 400 }: PriceChartProps) {
  // Index signal events by day for the merge below
  const signalsByDay = new Map<string, TradeSignalEvent>();
  (signals ?? []).forEach(s => signalsByDay.set(dayKey(s.date), s));

  // Format data for Recharts, attaching buy/sell marker values where a signal fired
  const chartData = data.map(d => {
    const signal = signalsByDay.get(dayKey(d.date));
    return {
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: d.close,
      sma_50: d.sma_50,
      sma_200: d.sma_200,
      buySignal: signal?.type === 'BUY' ? d.close : undefined,
      sellSignal: signal?.type === 'SELL' ? d.close : undefined,
      signalReason: signal?.reason,
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const byKey = (key: string) => payload.find((p: any) => p.dataKey === key);
      const price = byKey('price');
      const sma50 = byKey('sma_50');
      const sma200 = byKey('sma_200');
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-gray-300 text-sm mb-1">{point.date}</p>
          {price && (
            <p className="text-blue-400 font-medium">
              Price: ${price.value?.toFixed(2)}
            </p>
          )}
          {showMovingAverages && sma50 && (
            <p className="text-yellow-400 text-sm">
              SMA-50: ${sma50.value?.toFixed(2)}
            </p>
          )}
          {showMovingAverages && sma200 && (
            <p className="text-purple-400 text-sm">
              SMA-200: ${sma200.value?.toFixed(2)}
            </p>
          )}
          {point.buySignal != null && (
            <p className="text-green-400 text-sm mt-1 font-medium">▲ BUY — {point.signalReason}</p>
          )}
          {point.sellSignal != null && (
            <p className="text-red-400 text-sm mt-1 font-medium">▼ SELL — {point.signalReason}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const hasSignals = (signals?.length ?? 0) > 0;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#9CA3AF' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="Price"
          />
          {showMovingAverages && (
            <>
              <Line
                type="monotone"
                dataKey="sma_50"
                stroke="#FBBF24"
                strokeWidth={1.5}
                dot={false}
                name="50-day MA"
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="sma_200"
                stroke="#A855F7"
                strokeWidth={1.5}
                dot={false}
                name="200-day MA"
                strokeDasharray="5 5"
              />
            </>
          )}
          {hasSignals && (
            <>
              <Scatter dataKey="buySignal" name="Buy signal" fill="#10B981" shape={<BuyMarker />} legendType="triangle" />
              <Scatter dataKey="sellSignal" name="Sell signal" fill="#EF4444" shape={<SellMarker />} legendType="triangle" />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
