/**
 * Reviewer Agent (SEO & Tech)
 * 코드 블록 문법 오류, 기술적 정확도, SEO 키워드 검토 및 수정 제안
 */

import { geminiPro } from '../config/models';
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
- 개선 시 반드시 친근한 존댓말(~해요, ~네요, ~입니다 체)을 유지해주세요.
- 반말은 절대 사용하지 마세요.
- 개인적이고 진정성 있는 톤을 유지해주세요.
`
      : `
**중요: 이 글은 기술 블로그입니다.**
- 전문적이지만 친근한 존댓말을 유지해주세요.
`;

    // 종합 리뷰 프롬프트
    const reviewPrompt = `
당신은 블로그 전문 리뷰어입니다. 다음 블로그 포스트를 검토해주세요.
${categoryGuideline}
주제: ${state.topic}

콘텐츠:
${contentToReview}

다음 항목들을 검토하고 JSON 형식으로 결과를 반환해주세요:

**SEO 검토**
   - 주제 관련 키워드가 자연스럽게 포함되어 있는지
   - 제목, 소제목에 키워드가 포함되어 있는지
   - 콘텐츠 길이가 SEO에 적합한지 (최소 1000자)
   - 내부/외부 링크 활용 여부

다음 JSON 형식으로 반환해주세요 (점수와 요약만 반환, 개선된 콘텐츠는 반환하지 마세요):

{
  "seoScore": 85,
  "techAccuracy": 90,
  "codeIssues": [],
  "techIssues": [],
  "seoIssues": [],
  "summary": "전체 검토 요약"
}

점수 기준 (seoScore, techAccuracy 각각):
- 90-100: 우수 (바로 게시 가능)
- 70-89: 양호 (소소한 수정 권장)
- 50-69: 보통 (수정 필요)
- 50 미만: 미흡 (대폭 수정 필요)

JSON만 반환해주세요.
`;

    const reviewResponse = await geminiPro.invoke(reviewPrompt);
    const reviewContent = reviewResponse.content.toString();

    // JSON 추출
    const jsonMatch = reviewContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('리뷰 결과 JSON을 추출할 수 없습니다.');
    }

    const parsedReview = JSON.parse(jsonMatch[0]);

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
