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

    // 종합 리뷰 프롬프트
    const reviewPrompt = `
당신은 기술 블로그 전문 리뷰어입니다. 다음 블로그 포스트를 검토해주세요.

주제: ${state.topic}

콘텐츠:
${contentToReview}

다음 항목들을 검토하고 JSON 형식으로 결과를 반환해주세요:

1. **코드 블록 검토**
   - 문법 오류 확인
   - 코드 블록이 제대로 닫혔는지 확인
   - 적절한 언어 표시가 있는지 확인 (typescript, javascript 등)
   - 실행 가능한 코드인지 확인

2. **기술적 정확도 검토**
   - 기술 용어가 정확하게 사용되었는지
   - 설명이 기술적으로 정확한지
   - 최신 정보인지 (deprecated된 API 사용 여부)
   - Best Practice를 따르는지

3. **SEO 검토**
   - 주제 관련 키워드가 자연스럽게 포함되어 있는지
   - 제목, 소제목에 키워드가 포함되어 있는지
   - 콘텐츠 길이가 SEO에 적합한지 (최소 1000자)
   - 내부/외부 링크 활용 여부

다음 JSON 형식으로 반환해주세요:

{
  "score": 85,
  "codeIssues": [
    {"issue": "문제 설명", "suggestion": "수정 제안"}
  ],
  "techIssues": [
    {"issue": "문제 설명", "suggestion": "수정 제안"}
  ],
  "seoIssues": [
    {"issue": "문제 설명", "suggestion": "수정 제안"}
  ],
  "summary": "전체 검토 요약",
  "improvedContent": "수정이 필요한 경우 개선된 콘텐츠 (선택적)"
}

점수 기준:
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

    const reviewResult: ReviewResult = {
      passed: parsedReview.score >= 70,
      score: parsedReview.score,
      codeIssues: parsedReview.codeIssues || [],
      techIssues: parsedReview.techIssues || [],
      seoIssues: parsedReview.seoIssues || [],
      improvedContent: parsedReview.improvedContent,
    };

    const totalIssues =
      reviewResult.codeIssues.length +
      reviewResult.techIssues.length +
      reviewResult.seoIssues.length;

    onProgress?.({
      step: 'review',
      status: reviewResult.passed ? 'completed' : 'progress',
      message: reviewResult.passed
        ? `검토 완료! 점수: ${reviewResult.score}/100 (${totalIssues}개 개선 제안)`
        : `검토 완료. 점수: ${reviewResult.score}/100 - 수정이 필요합니다.`,
      data: { reviewResult, summary: parsedReview.summary },
    });

    // 점수가 낮으면 개선된 콘텐츠로 교체
    let updatedContent = state.draftContent;
    if (!reviewResult.passed && reviewResult.improvedContent) {
      updatedContent = reviewResult.improvedContent;
      onProgress?.({
        step: 'review',
        status: 'progress',
        message: '콘텐츠가 자동으로 개선되었습니다.',
      });
    }

    onProgress?.({
      step: 'review',
      status: 'completed',
      message: `리뷰 완료! 점수: ${reviewResult.score}/100`,
      data: { reviewResult },
    });

    return {
      draftContent: updatedContent,
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
