/**
 * Gemini Creator Agent
 * 초안을 개선하고 메타데이터 생성
 */

import { geminiPro } from '../config/models';
import { BlogPostState, OnProgressCallback, PostMetadata } from '../types/workflow';

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 생성 에이전트 - 콘텐츠 정제 및 메타데이터 생성
 */
export async function geminiCreator(
  state: BlogPostState,
  onProgress?: OnProgressCallback
): Promise<Partial<BlogPostState>> {
  try {
    onProgress?.({
      step: 'create',
      status: 'started',
      message: 'Gemini Pro로 콘텐츠 개선 및 메타데이터 생성 중...',
    });

    if (!state.draftContent) {
      throw new Error('초안이 없습니다. 먼저 초안을 작성해주세요.');
    }

    // 사람 피드백이 있으면 반영
    const feedbackInstruction = state.humanFeedback
      ? `\n\n사용자 피드백:\n${state.humanFeedback}\n\n위 피드백을 반영하여 콘텐츠를 개선해주세요.`
      : '';

    onProgress?.({
      step: 'create',
      status: 'progress',
      message: '콘텐츠 품질 개선 중...',
    });

    // 카테고리에 따른 콘텐츠 개선 프롬프트
    const isLifeCategory = state.category === 'life';

    const techContentPrompt = `
다음은 "${state.topic}" 주제에 대한 기술 블로그 포스트 초안입니다.

${state.draftContent}


이 초안을 다음과 같이 개선해주세요:

1. 문법과 맞춤법 검토
2. 문장을 더 명확하고 읽기 쉽게 개선
3. 코드 예제가 정확하고 실용적인지 확인
4. 전체적인 흐름과 논리 개선
5. SEO를 고려한 키워드 자연스럽게 포함

추가로 아래의 피드백도 자연스럽게 반영해주세요.
${feedbackInstruction}

`;

    const lifeContentPrompt = `
다음은 "${state.topic}" 주제에 대한 라이프스타일 블로그 포스트 초안입니다.

${state.draftContent}


이 초안을 다음과 같이 개선해주세요:

1. 문법과 맞춤법 검토
2. 문장을 더 명확하고 읽기 쉽게 개선
3. 개인적이고 진정성 있는 톤 유지
4. **반드시 차분하고 전문적인 존댓말 유지 (~합니다, ~입니다, ~됩니다 체), 반말 절대 금지**
5. 전체적인 흐름과 논리 개선
6. 자연스럽고 공감가는 표현으로 개선
7. 개발 또는 코드에 관한 내용 제거
8. SEO를 고려한 키워드 자연스럽게 포함

추가로 아래의 피드백도 자연스럽게 반영해주세요.
${feedbackInstruction}

`;

    const contentPrompt = isLifeCategory ? lifeContentPrompt : techContentPrompt;

    const contentResponse = await geminiPro.invoke(contentPrompt);
    const finalContent = contentResponse.content.toString();

    onProgress?.({
      step: 'create',
      status: 'progress',
      message: '메타데이터 생성 중...',
    });

    const currentDate = getCurrentDate();

    // 카테고리에 따른 메타데이터 생성 프롬프트
    const techMetadataPrompt = `
다음 기술 블로그 포스트에 대한 메타데이터를 생성해주세요:

주제: ${state.topic}

콘텐츠:
${finalContent.substring(0, 1000)}...

다음 JSON 형식으로 메타데이터를 생성해주세요:

{
  "title": "SEO 최적화된 제목 (60자 이내, 핵심 키워드 포함)",
  "summary": "매력적인 요약 (150자 이내, 검색 결과에 표시될 내용)",
  "keywords": ["Tech", "키워드2"],
  "status": "published",
  "tags": ["태그1", "태그2", "태그3"],
  "slug": "url-friendly-slug"
}

규칙:
- title: 명확하고 클릭하고 싶게, 60자 이내
- summary: 포스트의 핵심 내용 요약, 150자 이내
- keywords: "Tech"는 반드시 포함. 주요 카테고리 키워드 1-3개 (예: Tech, DevOps, Frontend)
- status: "published" 고정
- tags: 관련성 높은 기술 태그 3-5개
- slug: 소문자, 하이픈으로 연결, 영문만 사용 (예: next-js-app-router-guide)

**중요 - 콜론 사용 금지**:
- title과 summary 텍스트 안에 콜론(:) 뒤에 공백이 오면 YAML 파싱 오류가 발생합니다.
- 콜론 대신 하이픈(-)이나 쉼표(,)를 사용하세요.
- 잘못된 예: "주식 분석: 미래 전망" → 올바른 예: "주식 분석 - 미래 전망"

JSON만 반환해주세요.
`;

    const lifeMetadataPrompt = `
다음 라이프스타일 블로그 포스트에 대한 메타데이터를 생성해주세요:

주제: ${state.topic}

콘텐츠:
${finalContent.substring(0, 1000)}...

다음 JSON 형식으로 메타데이터를 생성해주세요:

{
  "title": "흥미롭고 공감되는 제목 (60자 이내)",
  "summary": "매력적인 요약 (150자 이내, 검색 결과에 표시될 내용)",
  "keywords": ["Life", "키워드2"],
  "status": "published",
  "tags": ["태그1", "태그2", "태그3"],
  "slug": "url-friendly-slug"
}

규칙:
- title: 따뜻하고 공감되는 제목, 60자 이내
- summary: 포스트의 핵심 내용 요약, 150자 이내
- keywords: 주요 카테고리 키워드 1-3개 (예: Life, 일상, 여행, 취미)
- status: "published" 고정
- tags: 관련성 높은 라이프스타일 태그 3-5개
- slug: 소문자, 하이픈으로 연결, 영문만 사용 (예: my-morning-routine)

**중요 - 콜론 사용 금지**:
- title과 summary 텍스트 안에 콜론(:) 뒤에 공백이 오면 YAML 파싱 오류가 발생합니다.
- 콜론 대신 하이픈(-)이나 쉼표(,)를 사용하세요.
- 잘못된 예: "주식 분석: 미래 전망" → 올바른 예: "주식 분석 - 미래 전망"

JSON만 반환해주세요.
`;

    const metadataPrompt = isLifeCategory ? lifeMetadataPrompt : techMetadataPrompt;

    const metadataResponse = await geminiPro.invoke(metadataPrompt);
    const metadataContent = metadataResponse.content.toString();

    // JSON 추출 (코드 블록이 있을 경우 제거)
    const jsonMatch = metadataContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('메타데이터 JSON을 추출할 수 없습니다.');
    }

    const parsedMetadata = JSON.parse(jsonMatch[0]);

    // 새 형식에 맞게 메타데이터 구성
    const defaultKeyword = isLifeCategory ? 'Life' : 'Tech';
    const metadata: PostMetadata = {
      title: parsedMetadata.title,
      summary: parsedMetadata.summary || parsedMetadata.description,
      keywords: parsedMetadata.keywords || [defaultKeyword],
      status: 'published',
      tags: parsedMetadata.tags,
      createdAt: currentDate,
      updatedAt: currentDate,
      slug: parsedMetadata.slug,
    };

    // 메타데이터 검증
    if (metadata.title.length > 60) {
      metadata.title = metadata.title.substring(0, 57) + '...';
    }
    if (metadata.summary.length > 150) {
      metadata.summary = metadata.summary.substring(0, 147) + '...';
    }

    onProgress?.({
      step: 'create',
      status: 'completed',
      message: '콘텐츠 개선 및 메타데이터 생성 완료!',
      data: { metadata },
    });

    return {
      finalContent,
      metadata,
      currentStep: 'create_completed',
      progress: 60,
    };
  } catch (error) {
    onProgress?.({
      step: 'create',
      status: 'error',
      message: `콘텐츠 생성 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      data: { error },
    });

    throw error;
  }
}
