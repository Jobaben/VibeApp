import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { PriceDataPoint } from '../types/stock';

interface VolumeChartProps {
  data: PriceDataPoint[];
  height?: number;
}

export default function VolumeChart({ data, height = 200 }: VolumeChartProps) {
  // Format data for Recharts
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    volume: d.volume,
    volumeAvg: d.volume_sma_20,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const volume = payload[0].value;
      const volumeAvg = payload[0].payload.volumeAvg;
      const percentDiff = volumeAvg ? ((volume - volumeAvg) / volumeAvg * 100).toFixed(1) : 0;

      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{payload[0].payload.date}</p>
          <p className="text-blue-400 font-medium">
            Volume: {(volume / 1000000).toFixed(2)}M
          </p>
          {volumeAvg && (
            <>
              <p className="text-gray-400 text-sm">
                Avg: {(volumeAvg / 1000000).toFixed(2)}M
              </p>
              <p className={`text-sm ${Number(percentDiff) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Number(percentDiff) >= 0 ? '+' : ''}{percentDiff}% vs avg
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-300">Volume</h3>
        <p className="text-xs text-gray-500">
          Daily trading volume with 20-day average
        </p>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Average volume reference line */}
          {chartData.length > 0 && chartData[chartData.length - 1].volumeAvg && (
            <ReferenceLine
              y={chartData[chartData.length - 1].volumeAvg}
              stroke="#FBBF24"
              strokeDasharray="3 3"
              label={{ value: '20-day avg', fill: '#FBBF24', fontSize: 11, position: 'insideTopRight' }}
            />
          )}
          <Bar
            dataKey="volume"
            fill="#3B82F6"
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
