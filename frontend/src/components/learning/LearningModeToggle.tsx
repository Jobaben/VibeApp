import { useLearningMode } from '../../contexts/LearningModeContext';

export function LearningModeToggle() {
  const { isEnabled, toggleLearningMode, currentModule, getOverallProgress } = useLearningMode();
  const progress = getOverallProgress();

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={toggleLearningMode}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
          ${isEnabled
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
            : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-700'
          }
        `}
        title={isEnabled ? 'Learning Mode Active - Click to disable' : 'Enable Learning Mode'}
      >
        {/* Graduation Cap Icon */}
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${isEnabled ? 'scale-110' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l9-5-9-5-9 5 9 5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
          />
        </svg>

        <span className="hidden sm:inline">
          {isEnabled ? 'Learning' : 'Learn'}
        </span>

        {/* Progress indicator when enabled */}
        {isEnabled && progress > 0 && (
          <span className="hidden md:flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {progress}%
          </span>
        )}
      </button>

      {/* Learning Mode Active Indicator Bar */}
      {isEnabled && currentModule && (
        <div className="absolute right-0 top-full mt-2 z-40 hidden lg:block">
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs whitespace-nowrap">
            <div className="flex items-center gap-2 text-amber-300">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="font-medium">{currentModule.title}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearningModeToggle;
