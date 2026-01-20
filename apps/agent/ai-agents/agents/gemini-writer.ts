/**
 * Gemini Writer Agent
 * 리서치 데이터를 바탕으로 블로그 초안 작성
 */

import { geminiFlash } from '../config/models';
import { BlogPostState, OnProgressCallback } from '../types/workflow';

/**
 * 작성 에이전트 - 블로그 초안 작성
 */
export async function geminiWriter(
  state: BlogPostState,
  onProgress?: OnProgressCallback
): Promise<Partial<BlogPostState>> {
  try {
    onProgress?.({
      step: 'write',
      status: 'started',
      message: '블로그 초안 작성을 시작합니다...',
    });

    if (!state.researchData) {
      throw new Error('리서치 데이터가 없습니다. 먼저 리서치를 수행해주세요.');
    }

    const { sources, summary, keyPoints } = state.researchData;

    onProgress?.({
      step: 'write',
      status: 'progress',
      message: 'Gemini Flash로 콘텐츠 생성 중...',
    });

    // 블로그 초안 작성 프롬프트
    const prompt = `
당신은 경험 많은 프론트엔드 개발자이자 기술 블로거입니다.
다음 리서치 데이터를 바탕으로 "${state.topic}"에 대한 고품질 블로그 포스트를 작성해주세요.

## 리서치 요약
${summary}

## 핵심 포인트
${keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

## 참고 자료
${sources.map((source, i) => `
${i + 1}. ${source.title}
   ${source.snippet}
`).join('\n')}

## 작성 가이드라인

### 구조
1. **서론** (문제 제기)
   - 독자의 관심을 끄는 도입부
   - 이 주제가 왜 중요한지 설명
   - 이 글에서 무엇을 배울 수 있는지 명시

2. **본론** (개념 설명, 코드 예제, 실무 사례)
   - 핵심 개념을 명확하고 쉽게 설명
   - 실용적인 코드 예제 포함 (TypeScript/JavaScript)
   - 실무에서 어떻게 활용되는지 설명
   - 주의사항이나 Best Practice 포함

3. **결론** (핵심 정리, 다음 학습)
   - 핵심 내용 요약
   - 독자가 다음에 무엇을 학습하면 좋을지 제안

### 톤 & 스타일
- 친근하고 대화하는 듯한 톤
- 전문적이지만 어렵지 않게
- 실무 경험을 공유하는 느낌
- 코드 예제는 실용적이고 따라하기 쉽게

### 형식
- 제목은 포함하지 마세요 (메타데이터에서 따로 생성됩니다)
- 코드 블록은 적절한 언어 표시와 함께 \`\`\`typescript 또는 \`\`\`javascript 사용
- 섹션은 ## (h2), ### (h3)로 구분

블로그 포스트를 작성해주세요:
`;

    const response = await geminiFlash.invoke(prompt);
    const draftContent = response.content.toString();

    onProgress?.({
      step: 'write',
      status: 'completed',
      message: `블로그 초안 작성 완료! (${draftContent.length}자)`,
      data: { contentLength: draftContent.length },
    });

    return {
      draftContent,
      currentStep: 'write_completed',
      progress: 40,
    };
  } catch (error) {
    onProgress?.({
      step: 'write',
      status: 'error',
      message: `초안 작성 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      data: { error },
    });

    throw error;
  }
}
