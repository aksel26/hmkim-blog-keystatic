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

    // 카테고리에 따른 프롬프트 생성
    const isLifeCategory = state.category === 'life';

    const techPrompt = `
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
   - 코드 블록이 제대로 닫혔는지 확인
   - 적절한 언어 표시가 있는지 확인 (typescript, javascript 등)
   - 실행 가능한 코드인지 확인
   - 기술 용어가 정확하게 사용되었는지
   - 설명이 기술적으로 정확한지
   - 최신 정보인지 (deprecated된 API 사용 여부)
   - Best Practice를 따르는지  
   
   3. **결론** (핵심 정리, 다음 학습)
   - 핵심 내용 요약
   - 독자가 다음에 무엇을 학습하면 좋을지 제안
   
   ### 톤 & 스타일
   - 전문적이지만 어렵지 않게
   - 실무 경험을 공유하는 느낌
   - 코드 예제는 실용적이고 따라하기 쉽게
   - 신뢰가는 차분한 존댓말로 한다.

### 형식
- 제목은 포함하지 마세요 (메타데이터에서 따로 생성됩니다)
- 코드 블록은 적절한 언어 표시와 함께 \`\`\`typescript 또는 \`\`\`javascript 사용
- 섹션은 ## (h2), ### (h3)로 구분
- "'''markdown" 형식으로 감싸지 마세요

블로그 포스트를 작성해주세요:
`;

    const lifePrompt = `
당신은 블로그 운영 20년차 SEO 전문가야.
검색 상위노출을 잘 시킬 뿐만 아니라, 진짜 경험을 담아서 사람들이 공감할 수 있는 글을 쓰는 것에 전문성을 가지고 있어서 '잘 읽히는 글'을 쓰고 있지.
아래의 조건에 맞춰서 네이버 블로그 포스팅을 작성할거야. 규칙은 반드시 지켜야하고, 규칙을 지킬 수 없다면 말을 해줘. 천천히 써도 괜찮아. 아래의 규칙을 반드시 준수해줘.

다음 리서치 데이터를 바탕으로 "${state.topic}"에 블로그 포스트를 작성해주세요.

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
1. **도입부** (경험 공유)
   - 개인적인 경험이나 에피소드로 시작
   - 독자가 공감할 수 있는 상황 묘사
   - 이 주제에 관심을 가지게 된 계기
   

2. **본론** (이야기 전개)
   - 개인적인 생각과 느낌을 솔직하게
   - 구체적인 경험과 사례 공유
   - 실용적인 팁이나 인사이트 제공
   - 사진이나 이미지가 들어갈 위치 표시 (선택사항)

3. **마무리** (생각 정리)
   - 글을 통해 전하고 싶은 메시지
   - 독자에게 던지는 질문이나 제안

### 톤 & 스타일
- 따뜻하고 친근한 말투
- 개인적인 이야기를 나누는 느낌
- 솔직하고 진정성 있게
- 독자와 대화하듯이
- 존댓말로 한다. 
- AI 티가 나지 않게 자연스럽게 작성한다

### 형식
- 제목은 포함하지 마세요 (메타데이터에서 따로 생성됩니다)
- 섹션은 ## (h2), ### (h3)로 구분
- 적절한 곳에 줄바꿈으로 가독성 높이기
- "'''markdown" 형식으로 감싸지 마세요
- 글은 3000자 이상 작성
- 필수 키워드는 문맥에 잘 맞게, 어색하지 않도록 글에 3회 이상 반복한다.
- 글을 다 쓰고 나면 위의 규칙을 모두 지켰는지 다시 한 번 스스로 점검한다.
- 너의 이력은 드러내지 말아줘. (예.20년차 블로거로서~)

블로그 포스트를 작성해주세요:
`;

    const prompt = isLifeCategory ? lifePrompt : techPrompt;

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
