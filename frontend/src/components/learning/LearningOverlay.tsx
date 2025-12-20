import { useState, useEffect, useCallback, useRef } from 'react';
import { TourStep } from '../../types/learning';

interface LearningOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  steps: TourStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  title?: string;
}

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function LearningOverlay({
  isVisible,
  onClose,
  steps,
  currentStep,
  onStepChange,
  onComplete,
  title = 'Interactive Tour',
}: LearningOverlayProps) {
  const [spotlightPosition, setSpotlightPosition] = useState<SpotlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const step = steps[currentStep];

  // Calculate spotlight position based on target element
  const updatePositions = useCallback(() => {
    if (!step?.targetSelector) {
      setSpotlightPosition(null);
      return;
    }

    const targetElement = document.querySelector(step.targetSelector);
    if (!targetElement) {
      console.warn(`Tour target not found: ${step.targetSelector}`);
      setSpotlightPosition(null);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = 8;

    // Set spotlight position
    setSpotlightPosition({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding + window.scrollX,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Scroll element into view if needed
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Calculate tooltip position
    const tooltipWidth = 320;
    const tooltipHeight = 200; // Approximate
    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (step.position) {
      case 'top':
        tooltipTop = rect.top - tooltipHeight - 16 + window.scrollY;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        break;
      case 'bottom':
        tooltipTop = rect.bottom + 16 + window.scrollY;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        break;
      case 'left':
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        tooltipLeft = rect.left - tooltipWidth - 16 + window.scrollX;
        break;
      case 'right':
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        tooltipLeft = rect.right + 16 + window.scrollX;
        break;
    }

    // Ensure tooltip stays within viewport
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
    tooltipTop = Math.max(16, tooltipTop);

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
  }, [step]);

  // Update positions when step changes or window resizes
  useEffect(() => {
    if (!isVisible) return;

    updatePositions();

    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isVisible, currentStep, updatePositions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (currentStep < steps.length - 1) {
            onStepChange(currentStep + 1);
          } else {
            onComplete();
          }
          break;
        case 'ArrowLeft':
          if (currentStep > 0) {
            onStepChange(currentStep - 1);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentStep, steps.length, onStepChange, onComplete, onClose]);

  if (!isVisible || !step) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dark overlay with spotlight cutout */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm">
        {spotlightPosition && (
          <div
            className="absolute rounded-lg ring-2 ring-blue-400 ring-offset-4 ring-offset-transparent shadow-2xl shadow-blue-500/30"
            style={{
              top: spotlightPosition.top,
              left: spotlightPosition.left,
              width: spotlightPosition.width,
              height: spotlightPosition.height,
              boxShadow: `
                0 0 0 9999px rgba(0, 0, 0, 0.8),
                0 0 30px 10px rgba(59, 130, 246, 0.3)
              `,
            }}
          />
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[101] p-2 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-lg border border-white/10"
        aria-label="Close tour"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Skip tour button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-[101] px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        Skip Tour
      </button>

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute z-[101] w-80 bg-gray-900 border border-blue-500/30 rounded-xl shadow-2xl shadow-blue-500/20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-5 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            <span className="text-xs text-gray-400">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h4 className="text-lg font-semibold text-white mb-2">{step.title}</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{step.content}</p>

          {/* Action hint */}
          {step.action && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span>
                {step.action === 'click' && 'Click the highlighted element to continue'}
                {step.action === 'hover' && 'Hover over the highlighted element'}
                {step.action === 'scroll' && 'Scroll to see more'}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Navigation */}
        <div className="px-5 py-4 bg-gray-800/50 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => onStepChange(currentStep - 1)}
            disabled={isFirstStep}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isFirstStep
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex gap-1">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => onStepChange(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : index < currentStep
                    ? 'bg-blue-500/50'
                    : 'bg-gray-600'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (isLastStep) {
                onComplete();
              } else {
                onStepChange(currentStep + 1);
              }
            }}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing tour state
export function useTour(steps: TourStep[]) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsVisible(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsVisible(false);
    setCurrentStep(0);
  }, []);

  const completeTour = useCallback(() => {
    setIsVisible(false);
    setCurrentStep(0);
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  return {
    isVisible,
    currentStep,
    startTour,
    closeTour,
    completeTour,
    goToStep,
    step: steps[currentStep],
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
  };
}
