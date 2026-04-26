import type { LearningDashboardMetrics } from '../../types/learningLab';
import { DASHBOARD } from './copy';

interface LearningDashboardCardProps {
  metrics: LearningDashboardMetrics;
  formatMoney: (value: number) => string;
}

export default function LearningDashboardCard({
  metrics,
  formatMoney,
}: LearningDashboardCardProps) {
  return (
    <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
      <h3 className="text-lg text-white font-semibold mb-3">{DASHBOARD.sectionTitle}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-gray-800/70 p-3">
          <p className="text-gray-400">{DASHBOARD.metrics.completedPlans}</p>
          <p className="text-white text-lg font-semibold">{metrics.completedPlans}</p>
        </div>
        <div className="rounded-lg bg-gray-800/70 p-3">
          <p className="text-gray-400">{DASHBOARD.metrics.closedReviews}</p>
          <p className="text-white text-lg font-semibold">{metrics.closedReviews}</p>
        </div>
        <div className="rounded-lg bg-gray-800/70 p-3">
          <p className="text-gray-400">{DASHBOARD.metrics.averageWin}</p>
          <p className="text-emerald-400 text-lg font-semibold">{formatMoney(metrics.averageWin)}</p>
        </div>
        <div className="rounded-lg bg-gray-800/70 p-3">
          <p className="text-gray-400">{DASHBOARD.metrics.averageLoss}</p>
          <p className="text-red-400 text-lg font-semibold">{formatMoney(metrics.averageLoss)}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        {DASHBOARD.metrics.commonMistake}:{' '}
        {metrics.commonMistake ? metrics.commonMistake.replace(/_/g, ' ') : 'none recorded yet'}
      </p>
      <p className="text-xs text-gray-500 mt-2">{DASHBOARD.disclaimer}</p>
    </div>
  );
}
