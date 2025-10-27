import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { PriceDataPoint } from '../types/stock';

interface RSIChartProps {
  data: PriceDataPoint[];
  height?: number;
}

export default function RSIChart({ data, height = 200 }: RSIChartProps) {
  // Format data for Recharts
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rsi: d.rsi,
  })).filter(d => d.rsi !== undefined);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const rsi = payload[0].value;
      let status = 'Neutral';
      let color = 'text-gray-300';

      if (rsi >= 70) {
        status = 'Overbought';
        color = 'text-red-400';
      } else if (rsi <= 30) {
        status = 'Oversold';
        color = 'text-green-400';
      }

      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{payload[0].payload.date}</p>
          <p className={`${color} font-medium`}>
            RSI: {rsi?.toFixed(2)} ({status})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-300">RSI (Relative Strength Index)</h3>
        <p className="text-xs text-gray-500">
          RSI &lt; 30 = Oversold | RSI &gt; 70 = Overbought
        </p>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Reference lines for overbought/oversold */}
          <ReferenceLine
            y={70}
            stroke="#EF4444"
            strokeDasharray="3 3"
            label={{ value: '70', fill: '#EF4444', fontSize: 12 }}
          />
          <ReferenceLine
            y={30}
            stroke="#10B981"
            strokeDasharray="3 3"
            label={{ value: '30', fill: '#10B981', fontSize: 12 }}
          />
          <ReferenceLine
            y={50}
            stroke="#6B7280"
            strokeDasharray="1 1"
          />
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
