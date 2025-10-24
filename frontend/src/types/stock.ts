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
