/**
 * Reviewer Agent (SEO & Tech)
 * 코드 블록 문법 오류, 기술적 정확도, SEO 키워드 검토 및 수정 제안
 */

import { gemini } from '../config/models';
import { BlogPostState, OnProgressCallback } from '../types/workflow';

/**
 * 리뷰 결과 인터페이스
 */
export interface ReviewResult {
  passed: boolean;
  score: number; // 0-100
  seoScore: number; // 0-100
  techAccuracy: number; // 0-100
  codeIssues: Array<{
    line?: number;
    issue: string;
    suggestion: string;
  }>;
  techIssues: Array<{
    issue: string;
    suggestion: string;
  }>;
  seoIssues: Array<{
    issue: string;
    suggestion: string;
  }>;
  suggestions: string[];
  issues: string[];
  improvedContent?: string;
}

/**
 * Reviewer 에이전트 - SEO 및 기술 검토
 */
export async function reviewer(
  state: BlogPostState,
  onProgress?: OnProgressCallback
): Promise<Partial<BlogPostState> & { reviewResult?: ReviewResult }> {
  try {
    onProgress?.({
      step: 'review',
      status: 'started',
      message: 'SEO 및 기술 검토를 시작합니다...',
    });

    const contentToReview = state.draftContent || state.finalContent;

    if (!contentToReview) {
      throw new Error('검토할 콘텐츠가 없습니다.');
    }

    onProgress?.({
      step: 'review',
      status: 'progress',
      message: '코드 블록 문법 검사 중...',
    });

    // 카테고리에 따른 리뷰 프롬프트 생성
    const isLifeCategory = state.category === 'life';

    const categoryGuideline = isLifeCategory
      ? `
**중요: 이 글은 라이프스타일 블로그입니다.**
- 개선 시 반드시 차분하고 전문적인 존댓말(~합니다, ~입니다, ~됩니다 체)을 유지해주세요.
- 반말은 절대 사용하지 마세요.
- 개인적이고 진정성 있는 톤을 유지해주세요.
`
      : `
**중요: 이 글은 기술 블로그입니다.**
- 차분하고 전문적인 존댓말(~합니다, ~입니다, ~됩니다 체)을 유지해주세요.
- 반말은 절대 사용하지 마세요.
`;

    // 톤/타겟 독자 정보
    const toneInfo = state.tone ? `\n말투: ${state.tone}` : '';
    const targetReaderInfo = state.targetReader ? `\n타겟 독자: ${state.targetReader}` : '';

    // 종합 리뷰 프롬프트
    const reviewPrompt = `
당신은 블로그 전문 리뷰어입니다. 다음 블로그 포스트를 검토해주세요.
${categoryGuideline}
주제: ${state.topic}${toneInfo}${targetReaderInfo}

콘텐츠:
${contentToReview}

다음 항목들을 검토하고 JSON 형식으로 결과를 반환해주세요:

**코드 검토** (codeIssues, 코드 블록이 없으면 빈 배열)
   - 코드 블록이 올바르게 열리고 닫혔는지, 언어 표시가 있는지
   - 문법 오류, 존재하지 않는 API, 설명과 다르게 동작하는 코드
   - 주제와 무관한 억지 예제나 가상의 시뮬레이션 코드

**내용 정확도 검토** (techIssues)
   - 사실과 다른 설명, 오래된 정보, 근거 없는 단정
   - 용어를 잘못 썼거나 개념을 혼동한 부분
   - 독자가 그대로 따라 하면 문제가 생길 절차

**SEO 검토** (seoIssues)
   - 주제 관련 키워드가 자연스럽게 포함되어 있는지
   - 제목, 소제목에 키워드가 포함되어 있는지
   - 콘텐츠 길이가 SEO에 적합한지 (최소 1000자)
   - 내부/외부 링크 활용 여부

**문장 검토** (seoIssues에 함께 넣는다)
   - 번역투: "~에 대해", "~을 통해", "~에 의해", "~함으로써", "~의 경우", "~하는 것이 가능하다"
   - AI가 쓴 티가 나는 표현: 상투적인 도입·맺음, "완벽 정리"·"획기적" 같은 과장, 정보가 없는 문장, "서론/본론/결론" 소제목, 굵은 글씨·구분선 남발
   - 해당 문장을 issue에 그대로 옮기고 suggestion에 고친 문장을 적는다

다음 JSON 형식으로 반환해주세요 (점수와 지적 사항만 반환, 개선된 콘텐츠는 반환하지 마세요).
각 배열의 항목은 반드시 issue와 suggestion을 가진 객체여야 합니다. 문자열로 쓰지 마세요.

{
  "seoScore": 85,
  "techAccuracy": 90,
  "codeIssues": [{ "issue": "무엇이 문제인지", "suggestion": "어떻게 고칠지" }],
  "techIssues": [{ "issue": "무엇이 문제인지", "suggestion": "어떻게 고칠지" }],
  "seoIssues": [{ "issue": "무엇이 문제인지", "suggestion": "어떻게 고칠지" }],
  "summary": "전체 검토 요약"
}

점수 기준 (seoScore, techAccuracy 각각):
- 90-100: 우수 (바로 게시 가능)
- 70-89: 양호 (소소한 수정 권장)
- 50-69: 보통 (수정 필요)
- 50 미만: 미흡 (대폭 수정 필요)

JSON만 반환해주세요.
`;

    const reviewResponse = await gemini.invoke(reviewPrompt);
    const reviewContent = reviewResponse.content.toString();

    // JSON 추출
    const jsonMatch = reviewContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('리뷰 결과 JSON을 추출할 수 없습니다.');
    }

    const parsedReview = JSON.parse(jsonMatch[0]);

    // 모델이 항목을 문자열로 돌려주기도 한다. 그대로 두면 creator 프롬프트에 "undefined → undefined"가 들어간다
    for (const key of ['codeIssues', 'techIssues', 'seoIssues'] as const) {
      parsedReview[key] = (Array.isArray(parsedReview[key]) ? parsedReview[key] : [])
        .map((i: unknown) => (typeof i === 'string' ? { issue: i, suggestion: '' } : i) as { issue?: unknown } | null)
        .filter((i: { issue?: unknown } | null) => i && typeof i.issue === 'string');
    }

    // 개별 점수에서 평균 점수 계산
    const seoScore = parsedReview.seoScore || 0;
    const techAccuracy = parsedReview.techAccuracy || 0;
    const avgScore = Math.round((seoScore + techAccuracy) / 2);

    // issues와 suggestions 추출
    const allIssues: string[] = [
      ...(parsedReview.codeIssues || []).map((i: { issue: string }) => i.issue),
      ...(parsedReview.techIssues || []).map((i: { issue: string }) => i.issue),
      ...(parsedReview.seoIssues || []).map((i: { issue: string }) => i.issue),
    ];
    const allSuggestions: string[] = [
      ...(parsedReview.codeIssues || []).map((i: { suggestion: string }) => i.suggestion),
      ...(parsedReview.techIssues || []).map((i: { suggestion: string }) => i.suggestion),
      ...(parsedReview.seoIssues || []).map((i: { suggestion: string }) => i.suggestion),
    ];

    const reviewResult: ReviewResult = {
      passed: avgScore >= 70,
      score: avgScore,
      seoScore,
      techAccuracy,
      codeIssues: parsedReview.codeIssues || [],
      techIssues: parsedReview.techIssues || [],
      seoIssues: parsedReview.seoIssues || [],
      suggestions: allSuggestions.filter(Boolean),
      issues: allIssues.filter(Boolean),
    };

    const totalIssues =
      reviewResult.codeIssues.length +
      reviewResult.techIssues.length +
      reviewResult.seoIssues.length;

    onProgress?.({
      step: 'review',
      status: 'completed',
      message: `리뷰 완료! SEO: ${reviewResult.seoScore}/100, 기술: ${reviewResult.techAccuracy}/100 (${totalIssues}개 개선 제안)`,
      data: { reviewResult, summary: parsedReview.summary },
    });

    return {
      currentStep: 'review_completed',
      progress: 35,
      reviewResult,
    };
  } catch (error) {
    onProgress?.({
      step: 'review',
      status: 'error',
      message: `리뷰 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      data: { error },
    });

    throw error;
  }
}
