import type { NaverCategory, ProviderResult, Timeframe } from "../types";
import { MissingApiKeyError } from "../types";

const NAVER_DATALAB_URL =
  "https://openapi.naver.com/v1/datalab/search";
const TIMEOUT_MS = 8000;

type KeywordGroup = { groupName: string; keywords: string[] };

// 카테고리별 키워드 그룹 정의
const KEYWORD_GROUPS_BY_CATEGORY: Record<NaverCategory, KeywordGroup[]> = {
  tech: [
    { groupName: "ChatGPT", keywords: ["ChatGPT", "챗GPT", "챗지피티"] },
    { groupName: "AI", keywords: ["AI", "인공지능", "생성형AI"] },
    { groupName: "클로드", keywords: ["Claude AI", "클로드", "Anthropic"] },
    { groupName: "React", keywords: ["React", "리액트", "Next.js"] },
    { groupName: "Python", keywords: ["Python", "파이썬"] },
  ],
  finance: [
    { groupName: "비트코인", keywords: ["비트코인", "Bitcoin", "BTC"] },
    { groupName: "주식", keywords: ["주식", "코스피", "나스닥"] },
    { groupName: "부동산", keywords: ["부동산", "아파트 매매", "전세"] },
  ],
  company: [
    { groupName: "테슬라", keywords: ["테슬라", "Tesla", "일론 머스크"] },
    { groupName: "삼성전자", keywords: ["삼성전자", "갤럭시"] },
    { groupName: "애플", keywords: ["애플", "아이폰", "iPhone"] },
    { groupName: "넷플릭스", keywords: ["넷플릭스", "Netflix"] },
  ],
  lifestyle: [
    { groupName: "취업", keywords: ["취업", "채용", "이직"] },
    { groupName: "여행", keywords: ["여행", "해외여행", "항공권"] },
    { groupName: "다이어트", keywords: ["다이어트", "헬스", "운동"] },
  ],
};

// 선택된 카테고리의 키워드 그룹을 5개씩 배치로 나눔 (API 제한)
function buildBatches(categories?: NaverCategory[]): KeywordGroup[][] {
  const cats = categories && categories.length > 0
    ? categories
    : (Object.keys(KEYWORD_GROUPS_BY_CATEGORY) as NaverCategory[]);

  const allGroups = cats.flatMap((cat) => KEYWORD_GROUPS_BY_CATEGORY[cat]);
  const batches: KeywordGroup[][] = [];
  for (let i = 0; i < allGroups.length; i += 5) {
    batches.push(allGroups.slice(i, i + 5));
  }
  return batches;
}

function buildDateRange(timeframe: Timeframe): {
  startDate: string;
  endDate: string;
  timeUnit: string;
} {
  const end = new Date();
  const start = new Date();

  switch (timeframe) {
    case "4h":
    case "24h":
      start.setDate(start.getDate() - 1);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
  }

  return {
    startDate: toDateStr(start),
    endDate: toDateStr(end),
    timeUnit: timeframe === "30d" ? "week" : "date",
  };
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

interface NaverResponse {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: Array<{
    title: string;
    keywords: string[];
    data: Array<{
      period: string;
      ratio: number;
    }>;
  }>;
  errorMessage?: string;
  errorCode?: string;
}

export async function fetchNaverTrends(
  _country: string,
  timeframe: Timeframe,
  limit: number,
  categories?: NaverCategory[],
): Promise<ProviderResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new MissingApiKeyError("naver");
  }

  const { startDate, endDate, timeUnit } = buildDateRange(timeframe);
  const batches = buildBatches(categories);

  // 여러 배치를 병렬 호출
  const batchResults = await Promise.all(
    batches.map((batch) =>
      fetchBatch(clientId, clientSecret, {
        startDate,
        endDate,
        timeUnit,
        keywordGroups: batch,
      }),
    ),
  );

  // 모든 배치 결과를 합산하고 최신 ratio 기준 정렬
  const allResults = batchResults.flat();
  allResults.sort((a, b) => b.latestRatio - a.latestRatio);

  const keywords = allResults.slice(0, limit).map((item, index) => ({
    keyword: item.title,
    rank: index + 1,
    score: Math.round(item.latestRatio),
  }));

  return {
    keywords,
    fetchedAt: new Date().toISOString(),
  };
}

interface BatchResult {
  title: string;
  latestRatio: number;
}

async function fetchBatch(
  clientId: string,
  clientSecret: string,
  body: {
    startDate: string;
    endDate: string;
    timeUnit: string;
    keywordGroups: Array<{ groupName: string; keywords: string[] }>;
  },
): Promise<BatchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(NAVER_DATALAB_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Naver DataLab returned ${res.status}: ${text.slice(0, 200)}`,
      );
    }

    const data: NaverResponse = await res.json();

    if (data.errorCode) {
      throw new Error(
        `Naver DataLab error: ${data.errorCode} - ${data.errorMessage}`,
      );
    }

    return (data.results ?? []).map((result) => {
      const latestData = result.data?.[result.data.length - 1];
      return {
        title: result.title,
        latestRatio: latestData?.ratio ?? 0,
      };
    });
  } finally {
    clearTimeout(timeout);
  }
}
