import { useLearningMode } from '../../contexts/LearningModeContext';

export function ProgressTracker() {
  const { progress, getOverallProgress, modules } = useLearningMode();
  const overallProgress = getOverallProgress();
  const completedModules = progress.completedModules.length;
  const totalModules = modules.length;

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Overall Progress</span>
          <span className="text-amber-400 font-medium">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-400">
            <span className="text-white font-medium">{progress.completedLessons.length}</span> lessons
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-gray-400">
            <span className="text-white font-medium">{completedModules}</span>/{totalModules} modules
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProgressTracker;
