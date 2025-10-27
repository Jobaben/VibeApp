import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PriceDataPoint } from '../types/stock';

interface PriceChartProps {
  data: PriceDataPoint[];
  showMovingAverages?: boolean;
  height?: number;
}

export default function PriceChart({ data, showMovingAverages = true, height = 400 }: PriceChartProps) {
  // Format data for Recharts
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: d.close,
    sma_50: d.sma_50,
    sma_200: d.sma_200,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{payload[0].payload.date}</p>
          <p className="text-blue-400 font-medium">
            Price: ${payload[0].value?.toFixed(2)}
          </p>
          {showMovingAverages && payload[1] && (
            <>
              <p className="text-yellow-400 text-sm">
                SMA-50: ${payload[1].value?.toFixed(2)}
              </p>
              {payload[2] && (
                <p className="text-purple-400 text-sm">
                  SMA-200: ${payload[2].value?.toFixed(2)}
                </p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
