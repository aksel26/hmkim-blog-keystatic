import type {
  TrendsResponse,
  TrendsQueryParams,
  TrendKeyword,
  TrendError,
  TrendSource,
  Timeframe,
  NaverCategory,
  CacheEntry,
} from "./types";
import { NAVER_CATEGORIES, MissingApiKeyError, AllSourcesFailedError } from "./types";
import { fetchGoogleTrends } from "./providers/google-serpapi";
import { fetchNaverTrends } from "./providers/naver";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30분
const cache = new Map<string, CacheEntry>();

const VALID_SOURCES: TrendSource[] = ["google", "naver"];
const VALID_TIMEFRAMES: Timeframe[] = ["4h", "24h", "7d", "30d"];

export function validateParams(raw: Record<string, string | undefined>):
  | { valid: true; parsed: TrendsQueryParams }
  | { valid: false; error: string } {
  // sources
  const sourcesStr = raw.sources ?? "google,naver";
  const sources = sourcesStr.split(",").map((s) => s.trim()) as TrendSource[];
  for (const s of sources) {
    if (!VALID_SOURCES.includes(s)) {
      return { valid: false, error: `Invalid source: "${s}". Valid: ${VALID_SOURCES.join(", ")}` };
    }
  }
  if (sources.length === 0) {
    return { valid: false, error: "At least one source is required" };
  }

  // country
  const country = raw.country ?? "KR";
  if (!/^[A-Z]{2}$/.test(country)) {
    return { valid: false, error: `Invalid country code: "${country}". Must be ISO 2-letter code (e.g. KR, US)` };
  }

  // timeframe
  const timeframe = (raw.timeframe ?? "24h") as Timeframe;
  if (!VALID_TIMEFRAMES.includes(timeframe)) {
    return { valid: false, error: `Invalid timeframe: "${timeframe}". Valid: ${VALID_TIMEFRAMES.join(", ")}` };
  }

  // limit
  const limitStr = raw.limit ?? "20";
  const limit = parseInt(limitStr, 10);
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return { valid: false, error: `Invalid limit: "${limitStr}". Must be 1-100` };
  }

  // naverCategories
  const naverCatsRaw = raw.naverCategories;
  let naverCategories: NaverCategory[] | undefined;
  if (naverCatsRaw) {
    naverCategories = naverCatsRaw.split(",").map((s) => s.trim()) as NaverCategory[];
    for (const c of naverCategories) {
      if (!(c in NAVER_CATEGORIES)) {
        return { valid: false, error: `Invalid Naver category: "${c}"` };
      }
    }
  }

  return { valid: true, parsed: { sources, country, timeframe, limit, naverCategories } };
}

function buildCacheKey(params: TrendsQueryParams): string {
  return JSON.stringify({
    sources: [...params.sources].sort(),
    country: params.country,
    timeframe: params.timeframe,
    limit: params.limit,
    naverCategories: params.naverCategories ? [...params.naverCategories].sort() : undefined,
  });
}

export async function fetchTrends(
  params: TrendsQueryParams,
): Promise<TrendsResponse> {
  const cacheKey = buildCacheKey(params);

  // 캐시 확인
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.data,
      meta: { ...cached.data.meta, cacheHit: true },
    };
  }

  const errors: TrendError[] = [];
  const allKeywords: Map<
    string,
    TrendKeyword
  > = new Map();
  const servedSources: TrendSource[] = [];

  // 요청된 sources에 대해 병렬 호출
  const providerCalls = params.sources.map(async (source) => {
    try {
      const result =
        source === "google"
          ? await fetchGoogleTrends(params.country, params.timeframe, params.limit)
          : await fetchNaverTrends(params.country, params.timeframe, params.limit, params.naverCategories);

      return { source, result, error: null };
    } catch (error) {
      return { source, result: null, error: error as Error };
    }
  });

  const results = await Promise.allSettled(providerCalls);

  for (const settled of results) {
    if (settled.status === "rejected") continue;

    const { source, result, error } = settled.value;

    if (error) {
      if (error instanceof MissingApiKeyError) {
        errors.push({
          source,
          code: "MISSING_API_KEY",
          message: error.message,
        });
      } else if (error.message.includes("timed out")) {
        errors.push({
          source,
          code: "TIMEOUT",
          message: error.message,
        });
      } else {
        errors.push({
          source,
          code: "API_ERROR",
          message: error.message,
        });
      }
      continue;
    }

    if (!result) continue;

    servedSources.push(source);

    // 키워드 병합: 같은 키워드 → source[] 합산
    for (const kw of result.keywords) {
      const key = kw.keyword.toLowerCase().trim();
      const existing = allKeywords.get(key);

      if (existing) {
        if (!existing.source.includes(source)) {
          existing.source.push(source);
        }
        if (kw.score !== undefined && existing.score === undefined) {
          existing.score = kw.score;
        }
        if (kw.rank < existing.rank) {
          existing.rank = kw.rank;
        }
        if (kw.related) {
          const existingUrls = new Set(
            (existing.related ?? []).map((r) => r.url),
          );
          const merged = [...(existing.related ?? [])];
          for (const r of kw.related) {
            if (!existingUrls.has(r.url)) {
              merged.push(r);
            }
          }
          existing.related = merged;
        }
      } else {
        allKeywords.set(key, {
          keyword: kw.keyword,
          rank: kw.rank,
          score: kw.score,
          source: [source],
          related: kw.related,
          fetchedAt: result.fetchedAt,
        });
      }
    }
  }

  // 전부 실패
  if (servedSources.length === 0) {
    throw new AllSourcesFailedError(errors);
  }

  // 정렬 + limit
  const keywords = Array.from(allKeywords.values())
    .sort((a, b) => a.rank - b.rank)
    .slice(0, params.limit);

  const response: TrendsResponse = {
    keywords,
    meta: {
      country: params.country,
      timeframe: params.timeframe,
      requestedSources: params.sources,
      servedSources,
      partial: servedSources.length < params.sources.length,
      cacheHit: false,
    },
    errors,
  };

  // 캐시 저장
  cache.set(cacheKey, { data: response, timestamp: Date.now() });

  // 만료된 캐시 정리 (100개 초과 시)
  if (cache.size > 100) {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
      }
    }
  }

  return response;
}
