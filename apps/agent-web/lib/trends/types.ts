export type TrendSource = "google" | "naver";

export type Timeframe = "4h" | "24h" | "7d" | "30d";

export interface RelatedNews {
  title: string;
  url: string;
}

export interface TrendKeyword {
  keyword: string;
  rank: number;
  score?: number;
  source: TrendSource[];
  related?: RelatedNews[];
  fetchedAt: string;
}

export interface TrendMeta {
  country: string;
  timeframe: Timeframe;
  requestedSources: TrendSource[];
  servedSources: TrendSource[];
  partial: boolean;
  cacheHit: boolean;
}

export interface TrendError {
  source: TrendSource;
  code: "MISSING_API_KEY" | "TIMEOUT" | "API_ERROR" | "PARSE_ERROR";
  message: string;
}

export interface TrendsResponse {
  keywords: TrendKeyword[];
  meta: TrendMeta;
  errors: TrendError[];
}

// Naver 키워드 그룹 카테고리
export type NaverCategory = "tech" | "finance" | "company" | "lifestyle";

export const NAVER_CATEGORIES: Record<NaverCategory, string> = {
  tech: "AI/기술",
  finance: "금융/투자",
  company: "기업",
  lifestyle: "생활",
};

export interface TrendsQueryParams {
  sources: TrendSource[];
  country: string;
  timeframe: Timeframe;
  limit: number;
  naverCategories?: NaverCategory[];
}

export interface ProviderResult {
  keywords: Array<{
    keyword: string;
    rank: number;
    score?: number;
    related?: RelatedNews[];
  }>;
  fetchedAt: string;
}

export interface CacheEntry {
  data: TrendsResponse;
  timestamp: number;
}

export class MissingApiKeyError extends Error {
  constructor(public source: TrendSource) {
    super(`API key not configured for ${source}`);
    this.name = "MissingApiKeyError";
  }
}

export class AllSourcesFailedError extends Error {
  constructor(public errors: TrendError[]) {
    super("All trend sources failed");
    this.name = "AllSourcesFailedError";
  }
}
