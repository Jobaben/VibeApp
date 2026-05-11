export type AIInsight = {
  strengths: string[];
  weaknesses: string[];
  catalyst_watch: string[];
};

export type DeepAnalysisStock = {
  ticker: string;
  name: string;
  price: number;
  sector?: string | null;
  signal: string;
  ai_insights: AIInsight;
  // Other fields exist in the backend schema (scores, fundamentals, technicals,
  // vs_sector) but are not consumed by this feature.
};

export type DeepAnalysisResponse = {
  stock: DeepAnalysisStock;
  historical_trends: Record<string, number[]>;
  peer_comparison: unknown[] | null;
};

export type AIErrorCode =
  | "llm_unavailable"
  | "llm_schema_error"
  | "rate_limited";

export type AIErrorBody = {
  detail: {
    detail: string;
    code: AIErrorCode;
  };
};
