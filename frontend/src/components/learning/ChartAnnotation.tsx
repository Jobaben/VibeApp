import { useState, useEffect, useRef, RefObject } from 'react';
import { useLearningMode } from '../../contexts/LearningModeContext';
import { Annotation } from '../../types/learning';

interface ChartAnnotationProps {
  chartRef: RefObject<HTMLDivElement>;
  annotations: Annotation[];
  activeAnnotation?: number;
  onAnnotationClick?: (index: number) => void;
  chartHeight?: number;
}

interface AnnotationPosition {
  x: number;
  y: number;
  markerX: number;
  markerY: number;
}

export function ChartAnnotation({
  chartRef,
  annotations,
  activeAnnotation = 0,
  onAnnotationClick,
  chartHeight = 300,
}: ChartAnnotationProps) {
  const { isEnabled, preferences } = useLearningMode();
  const [positions, setPositions] = useState<AnnotationPosition[]>([]);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate positions for annotations
  useEffect(() => {
    if (!chartRef.current) return;

    const updatePositions = () => {
      const chartRect = chartRef.current?.getBoundingClientRect();
      if (!chartRect) return;

      setChartDimensions({ width: chartRect.width, height: chartRect.height });

      const newPositions = annotations.map((annotation, index) => {
        // For auto positioning, distribute annotations evenly
        let x = annotation.x === 'auto'
          ? ((index + 1) / (annotations.length + 1)) * chartRect.width
          : typeof annotation.x === 'number'
            ? (annotation.x / 100) * chartRect.width
            : chartRect.width / 2;

        // Y position based on annotation level or fixed percentage
        let y: number;
        if (typeof annotation.y === 'string') {
          // Named positions like 'support_level', 'resistance_level'
          switch (annotation.y) {
            case 'support_level':
              y = chartRect.height * 0.75;
              break;
            case 'resistance_level':
              y = chartRect.height * 0.25;
              break;
            case 'center':
              y = chartRect.height * 0.5;
              break;
            case 'overbought':
              y = chartRect.height * 0.2;
              break;
            case 'oversold':
              y = chartRect.height * 0.8;
              break;
            default:
              y = chartRect.height * 0.5;
          }
        } else {
          y = (annotation.y / 100) * chartRect.height;
        }

        // Calculate tooltip position based on pointer direction
        let markerX = x;
        let markerY = y;

        return { x, y, markerX, markerY };
      });

      setPositions(newPositions);
    };

    updatePositions();

    const resizeObserver = new ResizeObserver(updatePositions);
    resizeObserver.observe(chartRef.current);

    return () => resizeObserver.disconnect();
  }, [chartRef, annotations]);

  if (!isEnabled || !preferences.showAnnotations || annotations.length === 0) {
    return null;
  }

  const currentAnnotation = annotations[activeAnnotation];
  const currentPosition = positions[activeAnnotation];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ height: chartHeight }}
    >
      {/* SVG layer for lines */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {positions.map((pos, index) => {
          const annotation = annotations[index];
          const isActive = index === activeAnnotation;

          return (
            <g key={index}>
              {/* Dashed line from marker to chart point */}
              <line
                x1={pos.markerX}
                y1={pos.markerY}
                x2={pos.x}
                y2={pos.y}
                stroke={annotation.lineColor || '#3b82f6'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray="4 4"
                opacity={isActive ? 1 : 0.5}
              />

              {/* Circle at chart point */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isActive ? 8 : 6}
                fill={annotation.lineColor || '#3b82f6'}
                opacity={isActive ? 0.3 : 0.2}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isActive ? 4 : 3}
                fill={annotation.lineColor || '#3b82f6'}
              />
            </g>
          );
        })}
      </svg>

      {/* Annotation markers */}
      {positions.map((pos, index) => {
        const annotation = annotations[index];
        const isActive = index === activeAnnotation;

        return (
          <button
            key={index}
            onClick={() => onAnnotationClick?.(index)}
            className={`absolute pointer-events-auto w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
              isActive
                ? 'bg-blue-500 text-white scale-110 ring-4 ring-blue-500/30'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-110'
            }`}
            style={{
              left: pos.markerX - 12,
              top: pos.markerY - 40,
              borderColor: annotation.lineColor,
            }}
          >
            {index + 1}
          </button>
        );
      })}

      {/* Active annotation tooltip */}
      {currentAnnotation && currentPosition && (
        <div
          className="absolute pointer-events-auto bg-gray-900 border border-blue-500/30 rounded-lg shadow-xl shadow-blue-500/10 p-4 max-w-xs animate-in fade-in zoom-in-95 duration-200"
          style={{
            left: Math.min(currentPosition.markerX, chartDimensions.width - 280),
            top: currentPosition.markerY - 100,
            minWidth: 240,
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentAnnotation.lineColor || '#3b82f6' }}
            />
            <h4 className="text-sm font-semibold text-white">{currentAnnotation.label}</h4>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-300">{currentAnnotation.description}</p>

          {/* Navigation dots */}
          {annotations.length > 1 && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
              {annotations.map((_, index) => (
                <button
                  key={index}
                  onClick={() => onAnnotationClick?.(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === activeAnnotation ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  aria-label={`View annotation ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Preset annotations for common chart patterns
export const PRICE_CHART_ANNOTATIONS: Annotation[] = [
  {
    x: 'auto',
    y: 'center',
    label: 'Price Line',
    description: 'This line shows the historical price movement of the stock. Each point represents the closing price for that day.',
    lineColor: '#22c55e',
  },
  {
    x: 'auto',
    y: 40,
    label: '50-Day Moving Average',
    description: 'The orange line shows the 50-day moving average. When price is above this line, the short-term trend is generally bullish.',
    lineColor: '#f97316',
  },
  {
    x: 'auto',
    y: 45,
    label: '200-Day Moving Average',
    description: 'The purple line shows the 200-day moving average. This represents the long-term trend. Price above this line indicates a bull market.',
    lineColor: '#a855f7',
  },
];

export const RSI_CHART_ANNOTATIONS: Annotation[] = [
  {
    x: 'auto',
    y: 'overbought',
    label: 'Overbought Zone (>70)',
    description: 'When RSI is above 70, the stock is considered overbought. This may indicate the price has risen too fast and could see a pullback.',
    lineColor: '#ef4444',
  },
  {
    x: 'auto',
    y: 'center',
    label: 'Neutral Zone',
    description: 'RSI between 30 and 70 indicates neutral momentum. The stock is neither overbought nor oversold.',
    lineColor: '#6b7280',
  },
  {
    x: 'auto',
    y: 'oversold',
    label: 'Oversold Zone (<30)',
    description: 'When RSI is below 30, the stock is considered oversold. This may indicate the price has fallen too fast and could see a bounce.',
    lineColor: '#22c55e',
  },
];

export const VOLUME_CHART_ANNOTATIONS: Annotation[] = [
  {
    x: 'auto',
    y: 'center',
    label: 'Volume Bars',
    description: 'Each bar represents the trading volume for that day. Taller bars mean more shares were traded.',
    lineColor: '#3b82f6',
  },
  {
    x: 'auto',
    y: 30,
    label: 'Average Volume',
    description: 'The dashed line shows the 20-day average volume. Volume above this line indicates above-average trading activity.',
    lineColor: '#f59e0b',
  },
];
