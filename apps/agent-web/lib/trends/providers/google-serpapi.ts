import type { ProviderResult, RelatedNews, Timeframe } from "../types";

const TIMEOUT_MS = 8000;

/**
 * Google Trends RSS 피드에서 실시간 인기 검색어를 가져옵니다.
 * API 키 불필요 (무료).
 */
export async function fetchGoogleTrends(
  country: string,
  _timeframe: Timeframe,
  limit: number,
): Promise<ProviderResult> {
  const url = `https://trends.google.com/trending/rss?geo=${encodeURIComponent(country)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TrendBot/1.0)",
      },
    });

    if (!res.ok) {
      throw new Error(`Google Trends RSS returned ${res.status}`);
    }

    const xml = await res.text();
    const keywords = parseRssItems(xml, limit);

    return {
      keywords,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Google Trends RSS request timed out (8s)");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseRssItems(
  xml: string,
  limit: number,
): Array<{ keyword: string; rank: number; score?: number; related?: RelatedNews[] }> {
  const items: Array<{
    keyword: string;
    rank: number;
    score?: number;
    related?: RelatedNews[];
  }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  let rank = 0;

  while ((match = itemRegex.exec(xml)) !== null && rank < limit) {
    const block = match[1];
    rank++;

    const title = extractTag(block, "title");
    if (!title) continue;

    // <ht:approx_traffic> 예: "200,000+"
    const trafficStr = extractTag(block, "ht:approx_traffic");
    const score = trafficStr
      ? parseInt(trafficStr.replace(/[^0-9]/g, ""), 10) || undefined
      : undefined;

    // <ht:news_item> 블록에서 제목 + URL 추출
    const newsItemRegex = /<ht:news_item>([\s\S]*?)<\/ht:news_item>/g;
    const related: RelatedNews[] = [];
    let newsMatch: RegExpExecArray | null;
    while ((newsMatch = newsItemRegex.exec(block)) !== null && related.length < 3) {
      const newsBlock = newsMatch[1];
      const newsTitle = extractTag(newsBlock, "ht:news_item_title");
      const newsUrl = extractTag(newsBlock, "ht:news_item_url");
      if (newsTitle && newsUrl) {
        related.push({
          title: decodeXml(newsTitle),
          url: decodeXml(newsUrl),
        });
      }
    }

    items.push({
      keyword: decodeXml(title),
      rank,
      score,
      related: related.length > 0 ? related : undefined,
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

function decodeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}
