import { useState, useRef, useEffect, ReactNode } from 'react';
import { useTooltip, MetricTooltipData } from '../../hooks/useTooltip';

interface MetricTooltipProps {
  metricKey: string;
  value?: number;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function MetricTooltip({ metricKey, value, children, position = 'top' }: MetricTooltipProps) {
  const { isTooltipsActive, activeTooltip, getTooltipData, toggleTooltip, hideTooltip, goToLesson, getInterpretation } = useTooltip();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isOpen = activeTooltip === metricKey;
  const tooltipData = getTooltipData(metricKey);
  const interpretation = value !== undefined ? getInterpretation(metricKey, value) : null;

  // Calculate tooltip position
  useEffect(() => {
    if (isOpen && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = -tooltipRect.height - 8;
          left = (containerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = containerRect.height + 8;
          left = (containerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = (containerRect.height - tooltipRect.height) / 2;
          left = -tooltipRect.width - 8;
          break;
        case 'right':
          top = (containerRect.height - tooltipRect.height) / 2;
          left = containerRect.width + 8;
          break;
      }

      setTooltipPosition({ top, left });
    }
  }, [isOpen, position]);

  // Close tooltip on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, hideTooltip]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        hideTooltip();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, hideTooltip]);

  if (!isTooltipsActive) {
    return <>{children}</>;
  }

  const getInterpretationColor = (interp: 'low' | 'medium' | 'high' | null) => {
    switch (interp) {
      case 'low':
        return 'text-yellow-400';
      case 'medium':
        return 'text-gray-300';
      case 'high':
        return 'text-green-400';
      default:
        return 'text-gray-300';
    }
  };

  const getInterpretationText = (data: MetricTooltipData | null, interp: 'low' | 'medium' | 'high' | null) => {
    if (!data || !interp) return null;
    return data.interpretation[interp].meaning;
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <div className="flex items-start gap-1">
        {children}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTooltip(metricKey);
          }}
          className="flex-shrink-0 p-0.5 rounded-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
          aria-label={`Learn more about ${tooltipData?.name || metricKey}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {isOpen && tooltipData && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-72 bg-gray-800 border border-blue-500/30 rounded-lg shadow-xl shadow-blue-500/10 p-4 animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              <h4 className="text-sm font-semibold text-white">{tooltipData.name}</h4>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                hideTooltip();
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-300 mb-3">{tooltipData.fullDescription}</p>

          {/* Value Interpretation */}
          {interpretation && (
            <div className="bg-gray-700/50 rounded-lg p-2 mb-3">
              <p className="text-xs text-gray-400 mb-1">Current interpretation:</p>
              <p className={`text-sm font-medium ${getInterpretationColor(interpretation)}`}>
                {getInterpretationText(tooltipData, interpretation)}
              </p>
            </div>
          )}

          {/* Interpretation Guide */}
          <div className="space-y-1 mb-3">
            <p className="text-xs text-gray-500 mb-1">Quick guide:</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <span className="text-gray-400">Low (&lt;{tooltipData.interpretation.low.threshold}):</span>
              <span className="text-gray-300">{tooltipData.interpretation.low.meaning.slice(0, 30)}...</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-gray-400">High (&gt;{tooltipData.interpretation.high.threshold}):</span>
              <span className="text-gray-300">{tooltipData.interpretation.high.meaning.slice(0, 30)}...</span>
            </div>
          </div>

          {/* Learn More Link */}
          {tooltipData.relatedLesson && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToLesson(tooltipData.relatedLesson!);
              }}
              className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Learn more in the course
            </button>
          )}

          {/* Arrow pointer */}
          <div
            className={`absolute w-2 h-2 bg-gray-800 border-blue-500/30 transform rotate-45 ${
              position === 'top'
                ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b'
                : position === 'bottom'
                ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t'
                : position === 'left'
                ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r'
                : 'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
            }`}
          />
        </div>
      )}
    </div>
  );
}

// Simple wrapper for enhancing existing metric displays
interface EnhancedMetricProps {
  label: string;
  value: string;
  metricKey?: string;
  numericValue?: number;
}

export function EnhancedMetricCard({ label, value, metricKey, numericValue }: EnhancedMetricProps) {
  const key = metricKey || label;

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <MetricTooltip metricKey={key} value={numericValue} position="top">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
      </MetricTooltip>
      <p className="text-white text-lg font-semibold">{value}</p>
    </div>
  );
}
