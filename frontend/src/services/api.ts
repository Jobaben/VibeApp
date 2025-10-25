import axios from 'axios';
import type {
  Stock,
  StockListResponse,
  StockSearchParams,
  StockSearchQuery,
  ScreenerCriteria,
  ScreenerResponse
} from '../types/stock';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Stock API endpoints
export const stockApi = {
  // Get paginated list of stocks
  getStocks: async (params?: StockSearchParams): Promise<StockListResponse> => {
    const response = await apiClient.get<StockListResponse>('/stocks/', { params });
    return response.data;
  },

  // Search stocks by ticker or name
  searchStocks: async (query: StockSearchQuery): Promise<Stock[]> => {
    const response = await apiClient.get<Stock[]>('/stocks/search', { params: query });
    return response.data;
  },

  // Get stock by ticker
  getStockByTicker: async (ticker: string): Promise<Stock> => {
    const response = await apiClient.get<Stock>(`/stocks/${ticker}`);
    return response.data;
  },

  // Get all available sectors
  getSectors: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/stocks/sectors');
    return response.data;
  },

  // Get top-scored stocks (for Phase 3)
  getTopStocks: async (limit: number = 20): Promise<Stock[]> => {
    const response = await apiClient.get<Stock[]>('/stocks/top', { params: { limit } });
    return response.data;
  },

  // Screener endpoints - Phase 2
  // Custom screener with criteria
  customScreener: async (criteria: ScreenerCriteria): Promise<ScreenerResponse> => {
    const response = await apiClient.post<ScreenerResponse>('/stocks/screener/custom', criteria);
    return response.data;
  },

  // Pre-built strategies
  valueGemsStrategy: async (limit: number = 50): Promise<ScreenerResponse> => {
    const response = await apiClient.get<ScreenerResponse>('/stocks/screener/strategies/value-gems', { params: { limit } });
    return response.data;
  },

  qualityCompoundersStrategy: async (limit: number = 50): Promise<ScreenerResponse> => {
    const response = await apiClient.get<ScreenerResponse>('/stocks/screener/strategies/quality-compounders', { params: { limit } });
    return response.data;
  },

  dividendKingsStrategy: async (limit: number = 50): Promise<ScreenerResponse> => {
    const response = await apiClient.get<ScreenerResponse>('/stocks/screener/strategies/dividend-kings', { params: { limit } });
    return response.data;
  },

  deepValueStrategy: async (limit: number = 50): Promise<ScreenerResponse> => {
    const response = await apiClient.get<ScreenerResponse>('/stocks/screener/strategies/deep-value', { params: { limit } });
    return response.data;
  },

  explosiveGrowthStrategy: async (limit: number = 50): Promise<ScreenerResponse> => {
    const response = await apiClient.get<ScreenerResponse>('/stocks/screener/strategies/explosive-growth', { params: { limit } });
    return response.data;
  },
};
