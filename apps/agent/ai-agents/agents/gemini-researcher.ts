/**
 * Gemini Researcher Agent
 * Tavily Search API로 웹 검색 후 Gemini Flash로 결과 요약
 */

import { gemini } from '../config/models';
import { BlogPostState, OnProgressCallback, ResearchData } from '../types/workflow';

/**
 * Tavily Search API 응답 타입
 */
interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilySearchResponse {
  results: TavilySearchResult[];
}

/**
 * 관련도(score)가 낮은 검색 결과를 버린다.
 * 주제와 무관한 결과가 섞이면 writer가 엉뚱한 내용을 끌어오고 fact_check가 대조할 근거도 흐려진다.
 * Tavily 문서는 score로 거르라고 권하고 임계값 0.5를 제시한다. 이 워크플로우는 긴 한국어 주제를 그대로
 * 검색어로 써서 관련 글도 0.25~0.6에 몰린다 (무관한 결과는 0.02 이하). 그래서 0.2로 낮춰 잡았다.
 * ponytail: 임계값 하나로 자른다. 주제에 따라 관련 글이 0.2 아래로 깔리면 MIN_RELEVANCE를 조정
 */
const MIN_RELEVANCE = 0.2;
const MIN_KEPT = 3; // 전부 걸러지면 쓸 자료가 없으니 상위 몇 개는 남긴다

export function dropIrrelevant<T extends { score: number }>(results: T[]): T[] {
  const sorted = [...results].sort((a, b) => b.score - a.score);
  const kept = sorted.filter((r) => r.score >= MIN_RELEVANCE);
  return kept.length >= MIN_KEPT ? kept : sorted.slice(0, MIN_KEPT);
}

/**
 * Tavily Search API 호출
 */
async function searchWithTavily(query: string): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn('TAVILY_API_KEY가 설정되지 않았습니다. Gemini로 대체합니다.');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        max_results: 10,
        search_depth: 'basic',
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as TavilySearchResponse;
    return dropIrrelevant(data.results || []);
  } catch (error) {
    console.error('Tavily 검색 실패:', error);
    return [];
  }
}

/**
 * 리서치 에이전트 - 웹 검색 및 요약
 */
export async function geminiResearcher(
  state: BlogPostState,
  onProgress?: OnProgressCallback
): Promise<Partial<BlogPostState>> {
  try {
    onProgress?.({
      step: 'research',
      status: 'started',
      message: `주제 "${state.topic}"에 대한 리서치를 시작합니다...`,
    });

    onProgress?.({
      step: 'research',
      status: 'progress',
      message: 'Tavily로 웹 검색 중...',
    });

    // Tavily로 웹 검색
    const searchResults = await searchWithTavily(state.topic);

    let researchData: ResearchData;

    if (searchResults.length > 0) {
      // Tavily 검색 결과가 있는 경우
      onProgress?.({
        step: 'research',
        status: 'progress',
        message: `${searchResults.length}개의 검색 결과를 찾았습니다. Gemini로 요약 중...`,
      });

      // 검색 결과를 sources 형식으로 변환
      const sources = searchResults.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
      }));

      // Gemini로 검색 결과 요약
      const summaryPrompt = `
다음은 "${state.topic}" 주제에 대한 웹 검색 결과입니다.

검색 결과:
${sources.map((s, i) => `
${i + 1}. ${s.title}
   URL: ${s.url}
   내용: ${s.snippet}
`).join('\n')}

위 검색 결과를 바탕으로 다음 JSON 형식으로 정리해주세요:

{
  "summary": "전체 내용을 3-4문장으로 요약",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3", ...]
}

JSON만 반환해주세요.
`;

      const summaryResponse = await gemini.invoke(summaryPrompt);
      const summaryContent = summaryResponse.content.toString();

      // JSON 추출
      const jsonMatch = summaryContent.match(/\{[\s\S]*\}/);
      const summaryData = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: '', keyPoints: [] };

      researchData = {
        sources,
        summary: summaryData.summary,
        keyPoints: summaryData.keyPoints,
      };
    } else {
      // Tavily 검색 결과가 없거나 API 키가 없는 경우 Gemini로 대체
      onProgress?.({
        step: 'research',
        status: 'progress',
        message: 'Gemini로 리서치 중...',
      });

      const geminiResearchPrompt = `
"${state.topic}"에 대한 블로그 포스트를 작성하기 위한 리서치를 수행해주세요.

다음 JSON 형식으로 리서치 결과를 작성해주세요:

{
  "sources": [
    {
      "title": "참고 자료 제목 1",
      "url": "https://example.com/1",
      "snippet": "핵심 내용 요약 1"
    },
    {
      "title": "참고 자료 제목 2",
      "url": "https://example.com/2",
      "snippet": "핵심 내용 요약 2"
    }
  ],
  "summary": "전체 내용을 3-4문장으로 요약",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
}

실제 존재하는 기술과 개념을 바탕으로 작성해주세요. JSON만 반환해주세요.
`;

      const geminiResponse = await gemini.invoke(geminiResearchPrompt);
      const geminiContent = geminiResponse.content.toString();

      // JSON 추출
      const jsonMatch = geminiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('리서치 결과를 파싱할 수 없습니다.');
      }

      researchData = JSON.parse(jsonMatch[0]);
    }

    onProgress?.({
      step: 'research',
      status: 'completed',
      message: '리서치가 완료되었습니다!',
      data: {
        sourceCount: researchData.sources.length,
        keyPointCount: researchData.keyPoints.length
      },
    });

    return {
      researchData,
      currentStep: 'research_completed',
      progress: 20,
    };
  } catch (error) {
    onProgress?.({
      step: 'research',
      status: 'error',
      message: `리서치 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      data: { error },
    });

    throw error;
  }
}
