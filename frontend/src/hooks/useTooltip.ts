import { useState, useCallback, useMemo } from 'react';
import { useLearningMode } from '../contexts/LearningModeContext';
import metricsData from '../content/tooltips/metrics.json';

export interface MetricTooltipData {
  key: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  interpretation: {
    low: { threshold: number; meaning: string };
    medium: { meaning: string };
    high: { threshold: number; meaning: string };
  };
  relatedLesson?: string;
}

// Map of metric keys from the app to tooltip keys
const METRIC_KEY_MAP: Record<string, string> = {
  // Valuation
  'P/E Ratio': 'pe_ratio',
  'PE Ratio': 'pe_ratio',
  'pe_ratio': 'pe_ratio',
  'P/B Ratio': 'pb_ratio',
  'PB Ratio': 'pb_ratio',
  'pb_ratio': 'pb_ratio',
  'PEG Ratio': 'peg_ratio',
  'peg_ratio': 'peg_ratio',
  'EV/EBITDA': 'ev_ebitda',
  'ev_ebitda': 'ev_ebitda',
  'P/S Ratio': 'ps_ratio',
  'ps_ratio': 'ps_ratio',

  // Profitability
  'ROIC': 'roic',
  'roic': 'roic',
  'ROE': 'roe',
  'roe': 'roe',
  'Gross Margin': 'gross_margin',
  'gross_margin': 'gross_margin',
  'Operating Margin': 'operating_margin',
  'operating_margin': 'operating_margin',
  'Net Margin': 'net_margin',
  'net_margin': 'net_margin',
  'FCF Yield': 'fcf_yield',
  'fcf_yield': 'fcf_yield',

  // Financial Health
  'Debt/Equity': 'debt_equity',
  'debt_equity': 'debt_equity',
  'Current Ratio': 'current_ratio',
  'current_ratio': 'current_ratio',
  'Interest Coverage': 'interest_coverage',
  'interest_coverage': 'interest_coverage',

  // Dividends
  'Dividend Yield': 'dividend_yield',
  'dividend_yield': 'dividend_yield',
  'Payout Ratio': 'payout_ratio',
  'payout_ratio': 'payout_ratio',

  // Technical
  'RSI': 'rsi',
  'rsi': 'rsi',
  '50-Day MA': 'sma_50',
  'SMA 50': 'sma_50',
  'sma_50': 'sma_50',
  '200-Day MA': 'sma_200',
  'SMA 200': 'sma_200',
  'sma_200': 'sma_200',

  // Scores
  'Total Score': 'total_score',
  'total_score': 'total_score',
  'Value Score': 'value_score',
  'value_score': 'value_score',
  'Quality Score': 'quality_score',
  'quality_score': 'quality_score',
  'Momentum Score': 'momentum_score',
  'momentum_score': 'momentum_score',
  'Health Score': 'health_score',
  'health_score': 'health_score',
  'Financial Health': 'health_score',
};

export function useTooltip() {
  const { isEnabled, preferences, startLesson } = useLearningMode();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Build a lookup map from metrics data
  const tooltipMap = useMemo(() => {
    const map = new Map<string, MetricTooltipData>();
    metricsData.metrics.forEach((metric) => {
      map.set(metric.key, metric as MetricTooltipData);
    });
    return map;
  }, []);

  // Get tooltip data for a metric
  const getTooltipData = useCallback((metricKey: string): MetricTooltipData | null => {
    // Normalize the key
    const normalizedKey = METRIC_KEY_MAP[metricKey] || metricKey.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return tooltipMap.get(normalizedKey) || null;
  }, [tooltipMap]);

  // Show tooltip for a metric
  const showTooltip = useCallback((metricKey: string) => {
    if (isEnabled && preferences.showTooltips) {
      setActiveTooltip(metricKey);
    }
  }, [isEnabled, preferences.showTooltips]);

  // Hide tooltip
  const hideTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  // Toggle tooltip
  const toggleTooltip = useCallback((metricKey: string) => {
    setActiveTooltip(prev => prev === metricKey ? null : metricKey);
  }, []);

  // Navigate to related lesson
  const goToLesson = useCallback((lessonId: string) => {
    startLesson(lessonId);
    hideTooltip();
  }, [startLesson, hideTooltip]);

  // Get interpretation for a value
  const getInterpretation = useCallback((metricKey: string, value: number): 'low' | 'medium' | 'high' | null => {
    const data = getTooltipData(metricKey);
    if (!data) return null;

    const { low, high } = data.interpretation;
    if (value < low.threshold) return 'low';
    if (value > high.threshold) return 'high';
    return 'medium';
  }, [getTooltipData]);

  // Check if tooltips are active (Learning Mode enabled + tooltips preference on)
  const isTooltipsActive = isEnabled && preferences.showTooltips;

  return {
    isTooltipsActive,
    activeTooltip,
    getTooltipData,
    showTooltip,
    hideTooltip,
    toggleTooltip,
    goToLesson,
    getInterpretation,
  };
}
