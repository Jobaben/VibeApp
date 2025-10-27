import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import type { ScoreBreakdownResponse, Signal } from '../types/stock';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownResponse;
}

const signalConfig: Record<Signal, { bg: string; text: string; label: string }> = {
  STRONG_BUY: { bg: 'bg-green-600', text: 'text-green-400', label: 'STRONG BUY' },
  BUY: { bg: 'bg-green-500', text: 'text-green-300', label: 'BUY' },
  HOLD: { bg: 'bg-yellow-500', text: 'text-yellow-300', label: 'HOLD' },
  SELL: { bg: 'bg-red-500', text: 'text-red-300', label: 'SELL' },
  STRONG_SELL: { bg: 'bg-red-600', text: 'text-red-400', label: 'STRONG SELL' },
};

export default function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const { total_score, signal, component_scores, strengths, weaknesses, reasoning } = breakdown;
  const config = signalConfig[signal];

  // Prepare data for radar chart
  const radarData = [
    { category: 'Value', score: component_scores.value, fullMark: 25 },
    { category: 'Quality', score: component_scores.quality, fullMark: 25 },
    { category: 'Momentum', score: component_scores.momentum, fullMark: 25 },
    { category: 'Health', score: component_scores.health, fullMark: 25 },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      {/* Header with total score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Score Breakdown</h2>
          <p className="text-gray-400 text-sm mt-1">{breakdown.name} ({breakdown.ticker})</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-white">{total_score.toFixed(1)}</div>
          <div className={`inline-block px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-semibold mt-1`}>
            {config.label}
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#4B5563" />
            <PolarAngleAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 14 }} />
            <PolarRadiusAxis angle={90} domain={[0, 25]} tick={{ fill: '#6B7280' }} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
                      <p className="text-gray-300 font-medium">{data.category}</p>
                      <p className="text-blue-400 text-lg font-bold">
                        {data.score.toFixed(1)} / {data.fullMark}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {((data.score / data.fullMark) * 100).toFixed(0)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Component Scores Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Value', score: component_scores.value, color: 'blue' },
          { name: 'Quality', score: component_scores.quality, color: 'green' },
          { name: 'Momentum', score: component_scores.momentum, color: 'yellow' },
          { name: 'Health', score: component_scores.health, color: 'purple' },
        ].map(({ name, score, color }) => {
          const percentage = (score / 25) * 100;
          return (
            <div key={name} className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm font-medium mb-1">{name}</div>
              <div className="text-2xl font-bold text-white">{score.toFixed(1)}</div>
              <div className="text-xs text-gray-500">/ 25 pts</div>
              <div className="mt-2 bg-gray-600 rounded-full h-2">
                <div
                  className={`bg-${color}-500 h-2 rounded-full transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reasoning */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Analysis</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{reasoning}</p>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Strengths
          </h3>
          <ul className="space-y-2">
            {strengths.length > 0 ? (
              strengths.map((strength, idx) => (
                <li key={idx} className="text-gray-300 text-sm flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>{strength}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm italic">No significant strengths identified</li>
            )}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Weaknesses
          </h3>
          <ul className="space-y-2">
            {weaknesses.length > 0 ? (
              weaknesses.map((weakness, idx) => (
                <li key={idx} className="text-gray-300 text-sm flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>{weakness}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm italic">No significant weaknesses identified</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
