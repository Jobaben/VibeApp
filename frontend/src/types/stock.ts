// Stock type definitions matching backend Pydantic schemas

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  isin?: string;
  instrument_type: string;
  sector?: string;
  industry?: string;
  market_cap?: number;
  currency: string;
  exchange?: string;
  last_updated?: string;
  created_at: string;
  updated_at: string;
}

export interface StockListResponse {
  items: Stock[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StockSearchParams {
  page?: number;
  page_size?: number;
  sector?: string;
  instrument_type?: string;
}

export interface StockSearchQuery {
  q: string;
  limit?: number;
}

export interface SectorOption {
  value: string;
  label: string;
}

// Fundamentals
export interface StockFundamentals {
  id: string;
  stock_id: string;
  pe_ratio?: number;
  ev_ebitda?: number;
  peg_ratio?: number;
  pb_ratio?: number;
  ps_ratio?: number;
  roic?: number;
  roe?: number;
  gross_margin?: number;
  operating_margin?: number;
  net_margin?: number;
  debt_equity?: number;
  current_ratio?: number;
  fcf_yield?: number;
  interest_coverage?: number;
  revenue_growth?: number;
  earnings_growth?: number;
  dividend_yield?: number;
  payout_ratio?: number;
  updated_at: string;
}

// Scores
export enum Signal {
  STRONG_BUY = "STRONG_BUY",
  BUY = "BUY",
  HOLD = "HOLD",
  SELL = "SELL",
  STRONG_SELL = "STRONG_SELL",
}

export interface StockScore {
  id: string;
  stock_id: string;
  total_score: number;
  value_score: number;
  quality_score: number;
  momentum_score: number;
  health_score: number;
  signal: Signal;
  calculated_at: string;
}

// Stock with full details
export interface StockDetail extends Stock {
  fundamentals?: StockFundamentals;
  scores?: StockScore;
}

// Screener types
export interface ScreenerCriteria {
  // Valuation filters
  pe_min?: number;
  pe_max?: number;
  peg_min?: number;
  peg_max?: number;
  pb_min?: number;
  pb_max?: number;

  // Profitability filters
  roic_min?: number;
  roic_max?: number;
  roe_min?: number;
  roe_max?: number;
  net_margin_min?: number;
  net_margin_max?: number;

  // Financial health filters
  debt_equity_min?: number;
  debt_equity_max?: number;
  current_ratio_min?: number;
  fcf_yield_min?: number;

  // Growth filters
  revenue_growth_min?: number;
  earnings_growth_min?: number;

  // Dividend filters
  dividend_yield_min?: number;
  dividend_yield_max?: number;
  payout_ratio_min?: number;
  payout_ratio_max?: number;

  // Market filters
  market_cap_min?: number;
  market_cap_max?: number;
  sector?: string;

  // Sorting
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
}

export interface ScreenerResult extends StockDetail {
  match_score?: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ScreenerResponse {
  results: ScreenerResult[];
  criteria: string;
  total_matches: number;
  strategy_name?: string;
}

// Strategy metadata for UI
export interface Strategy {
  id: string;
  name: string;
  emoji: string;
  description: string;
  criteria: string;
  target: string;
  apiCall: (limit?: number) => Promise<ScreenerResponse>;
}

// Phase 4: Historical Price Data & Technical Indicators
export interface PriceDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjusted_close?: number;
  // Technical indicators
  sma_50?: number;
  sma_200?: number;
  rsi?: number;
  volume_sma_20?: number;
  price_vs_sma50?: number;
  price_vs_sma200?: number;
  volume_trend?: number;
}

export interface HistoricalPricesResponse {
  ticker: string;
  period: string;
  record_count: number;
  data: PriceDataPoint[];
}

export interface TechnicalIndicators {
  price: number;
  sma_50: number;
  sma_200: number;
  rsi: number;
  volume: number;
  volume_sma_20: number;
  price_vs_sma50: number;
  price_vs_sma200: number;
  volume_trend: number;
}

export interface LatestIndicatorsResponse {
  ticker: string;
  as_of_date: string;
  indicators: TechnicalIndicators;
}

export interface MomentumComponent {
  name: string;
  score: number;
  max: number;
  value: number;
}

export interface MomentumScoreResponse {
  ticker: string;
  as_of_date?: string;
  momentum_score: number;
  signal: string;
  explanation: string;
  components: MomentumComponent[];
  indicators: TechnicalIndicators;
}

export interface ScoreBreakdownResponse {
  ticker: string;
  name: string;
  sector: string;
  total_score: number;
  signal: Signal;
  component_scores: {
    value: number;
    quality: number;
    momentum: number;
    health: number;
  };
  strengths: string[];
  weaknesses: string[];
  reasoning: string;
  has_momentum_data: boolean;
}

export interface LeaderboardStock {
  ticker: string;
  name: string;
  sector: string;
  total_score: number;
  signal: Signal;
  value_score: number;
  quality_score: number;
  momentum_score: number;
  health_score: number;
}

export interface SectorLeaderboard {
  [sector: string]: LeaderboardStock[];
}

// Phase 5: Watchlist types
export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  tickers: string[];  // Array of stock tickers
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistStock extends Stock {
  scores?: StockScore;
  addedAt?: string;
}
