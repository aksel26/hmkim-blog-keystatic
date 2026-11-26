/**
 * Gemini Creator Agent
 * 초안을 개선하고 메타데이터 생성
 */

import { gemini } from '../config/models';
import { ACCURACY_RULES_FOR_EDITING, KOREAN_STYLE_RULES, TITLE_RULES } from '../config/style-guide';
import { loadExistingPosts } from '../tools/post-index';
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
      message: 'Gemini로 콘텐츠 개선 및 메타데이터 생성 중...',
    });

    if (!state.draftContent) {
      throw new Error('초안이 없습니다. 먼저 초안을 작성해주세요.');
    }

    // 사람 피드백이 있으면 반영
    const feedbackInstruction = state.humanFeedback
      ? `\n\n사용자 피드백:\n${state.humanFeedback}\n\n위 피드백을 반영하여 콘텐츠를 개선해주세요.`
      : '';

    // 리뷰어가 지적한 개선점 반영 (이게 없으면 review 단계가 결과물에 아무 영향을 못 준다)
    const r = state.reviewResult;
    const reviewIssues = r
      ? [...r.codeIssues, ...r.techIssues, ...r.seoIssues].map((i) => `- ${i.issue}${i.suggestion ? ` → ${i.suggestion}` : ''}`)
      : [];
    const reviewInstruction = reviewIssues.length
      ? `\n\n리뷰어가 지적한 개선점 (반영하세요):\n${reviewIssues.join('\n')}`
      : '';

    // 정확도 검증 지적은 재실행 때만 있다 (fact_check는 create 다음에 돈다)
    const factIssues = (state.factCheckResult?.issues ?? []).map(
      (i) => `- [${i.severity}] "${i.claim}": ${i.problem}${i.suggestion ? ` → ${i.suggestion}` : ''}`
    );
    const factInstruction = factIssues.length
      ? `\n\n정확도 검증에서 지적된 항목 (근거에 맞게 고치고, 확인할 수 없으면 단정 표현을 빼세요):\n${factIssues.join('\n')}`
      : '';

    onProgress?.({
      step: 'create',
      status: 'progress',
      message: '콘텐츠 품질 개선 중...',
    });

    // 카테고리에 따른 콘텐츠 개선 프롬프트
    const isLifeCategory = state.category === 'life';

    // 톤 매핑
    const toneMap: Record<string, string> = {
      formal: '격식체 (~합니다/~입니다)',
      casual: '편한체',
      friendly: '친근체 (~해요/~이에요)',
      professional: '전문가체 (~합니다/~입니다)',
    };
    const toneInstruction = state.tone
      ? `\n**말투**: ${toneMap[state.tone] || state.tone} 스타일을 유지하세요.`
      : '';
    const targetReaderInstruction = state.targetReader
      ? `\n**타겟 독자**: ${state.targetReader}에 맞는 수준과 어휘를 유지하세요.`
      : '';

    // 기존 글로 가는 내부 링크. 목록을 못 읽으면 지시 없이 진행한다
    const existingPosts = await loadExistingPosts();
    const internalLinkInstruction = existingPosts.length
      ? `\n**내부 링크**: 아래는 블로그에 이미 올라간 글 목록입니다. 본문 내용과 직접 이어지는 글이 있으면 2~3개를 본문 흐름에 맞는 자리에 마크다운 링크로 거세요. 주소는 목록의 경로를 그대로 쓰고, 목록에 없는 주소는 만들지 마세요. 이어지는 글이 없으면 링크를 넣지 마세요.\n${existingPosts
          .slice(0, 200)
          .map((p) => `- ${p.title}: ${p.path}`)
          .join('\n')}`
      : '';

    // 본문만 받기 위한 출력 규칙. 없으면 모델이 머리말과 "수정 사항 리포트"를 본문에 섞어 돌려준다
    const outputRule = `
${KOREAN_STYLE_RULES}
${ACCURACY_RULES_FOR_EDITING}
**출력 형식**: 개선된 포스트 본문(마크다운)만 <blog_post>와 </blog_post> 사이에 작성하세요.
머리말, 인사말, 수정 내역, 개선 사항 리포트, 작업 설명은 태그 안팎 어디에도 쓰지 마세요.`;

    const techContentPrompt = `
다음은 "${state.topic}" 주제에 대한 기술 블로그 포스트 초안입니다.

${state.draftContent}


이 초안을 다음과 같이 개선해주세요:

1. 문법과 맞춤법 검토
2. 아래 문장 규칙에 어긋나는 문장을 모두 고쳐 쓰기 (번역투, AI가 쓴 티가 나는 표현)
3. 코드 예제가 정확한지 확인. 주제와 무관한 억지 예제나 가상의 시뮬레이션 코드는 삭제
4. 전체적인 흐름과 논리 개선. 정보가 없는 문장은 지우되 초안이 다루는 절, 해결 방법, 코드 예제는 빠뜨리지 않기 (문장을 고치는 작업이지 내용을 줄이는 작업이 아님)
5. 독자가 이 주제를 찾을 때 검색창에 입력할 말(주 검색어)을 하나 정해 첫 문단과 소제목 하나에 자연스럽게 넣기
${toneInstruction}
${targetReaderInstruction}
${internalLinkInstruction}

추가로 아래의 피드백도 자연스럽게 반영해주세요.
${reviewInstruction}${factInstruction}${feedbackInstruction}
${outputRule}
`;

    const lifeContentPrompt = `
다음은 "${state.topic}" 주제에 대한 라이프스타일 블로그 포스트 초안입니다.

${state.draftContent}


이 초안을 다음과 같이 개선해주세요:

1. 문법과 맞춤법 검토
2. 아래 문장 규칙에 어긋나는 문장을 모두 고쳐 쓰기 (번역투, AI가 쓴 티가 나는 표현)
3. 개인적이고 진정성 있는 톤 유지
4. 전체적인 흐름과 논리 개선. 초안이 다루는 내용은 빠뜨리지 않기 (문장을 고치는 작업이지 내용을 줄이는 작업이 아님)
5. 자연스럽고 공감가는 표현으로 개선
6. 개발 또는 코드에 관한 내용 제거
7. 독자가 이 주제를 찾을 때 검색창에 입력할 말(주 검색어)을 하나 정해 첫 문단과 소제목 하나에 자연스럽게 넣기. 글이 어떤 말이나 개념을 다룬다면 그 말이 주 검색어다
${toneInstruction}
${targetReaderInstruction}
${internalLinkInstruction}

추가로 아래의 피드백도 자연스럽게 반영해주세요.
${reviewInstruction}${factInstruction}${feedbackInstruction}
${outputRule}
`;

    const contentPrompt = isLifeCategory ? lifeContentPrompt : techContentPrompt;

    const contentResponse = await gemini.invoke(contentPrompt);
    const rawContent = contentResponse.content.toString();
    // 태그 밖에 붙은 머리말·리포트는 버린다. 태그가 없으면 응답 전체를 그대로 쓴다
    const finalContent = (rawContent.match(/<blog_post>([\s\S]*)<\/blog_post>/)?.[1] ?? rawContent).trim();

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
  "title": "주 검색어로 시작하는 제목 (60자 이내)",
  "summary": "첫 문장에 주 검색어를 넣은 요약 (150자 이내, 검색 결과에 표시될 내용)",
  "keywords": ["주 검색어", "표기 변형"],
  "status": "published",
  "tags": ["태그1", "태그2", "태그3"],
  "slug": "url-friendly-slug"
}

규칙:
- 주 검색어: 본문 첫 문단과 소제목에 들어간 말 가운데 독자가 검색창에 입력할 말 하나. 예: "Claude Code 작업 완료 알림"
- title: 주 검색어를 앞쪽에 두고, 글을 읽으면 무엇을 얻는지 함께 적는다. 60자 이내
- summary: 첫 문장에 주 검색어를 넣고 글이 답하는 내용을 바로 말한다. 150자 이내
- keywords: 주 검색어와 그 표기 변형(띄어쓰기, 한글·영문 표기) 2-5개 (예: "Claude Code 알림", "클로드 코드 알림")
- status: "published" 고정
- tags: 관련성 높은 기술 태그 3-5개
- slug: 소문자, 하이픈으로 연결, 영문만 사용 (예: next-js-app-router-guide)

**중요 - 콜론 사용 금지**:
- title과 summary 텍스트 안에 콜론(:) 뒤에 공백이 오면 YAML 파싱 오류가 발생합니다.
- 콜론 대신 하이픈(-)이나 쉼표(,)를 사용하세요.
- 잘못된 예: "주식 분석: 미래 전망" → 올바른 예: "주식 분석 - 미래 전망"
${TITLE_RULES}
JSON만 반환해주세요.
`;

    const lifeMetadataPrompt = `
다음 라이프스타일 블로그 포스트에 대한 메타데이터를 생성해주세요:

주제: ${state.topic}

콘텐츠:
${finalContent.substring(0, 1000)}...

다음 JSON 형식으로 메타데이터를 생성해주세요:

{
  "title": "주 검색어가 들어간 공감되는 제목 (60자 이내)",
  "summary": "첫 문장에 주 검색어를 넣은 요약 (150자 이내, 검색 결과에 표시될 내용)",
  "keywords": ["주 검색어", "표기 변형"],
  "status": "published",
  "tags": ["태그1", "태그2", "태그3"],
  "slug": "url-friendly-slug"
}

규칙:
- 주 검색어: 본문 첫 문단과 소제목에 들어간 말 가운데 독자가 검색창에 입력할 말 하나. 글이 새로 생긴 말이나 개념을 다루면 그 말이다 (예: "미트 프록시 뜻")
- title: 주 검색어를 앞쪽에 두고, 따뜻하고 공감되게. 60자 이내
- summary: 첫 문장에 주 검색어를 넣고 글이 답하는 내용을 바로 말한다. 150자 이내
- keywords: 주 검색어와 그 표기 변형(띄어쓰기, 한글·영문 표기) 2-5개 (예: "미트 프록시", "미트프록시", "Meat Proxy")
- status: "published" 고정
- tags: 관련성 높은 라이프스타일 태그 3-5개
- slug: 소문자, 하이픈으로 연결, 영문만 사용 (예: my-morning-routine)

**중요 - 콜론 사용 금지**:
- title과 summary 텍스트 안에 콜론(:) 뒤에 공백이 오면 YAML 파싱 오류가 발생합니다.
- 콜론 대신 하이픈(-)이나 쉼표(,)를 사용하세요.
- 잘못된 예: "주식 분석: 미래 전망" → 올바른 예: "주식 분석 - 미래 전망"
${TITLE_RULES}
JSON만 반환해주세요.
`;

    const metadataPrompt = isLifeCategory ? lifeMetadataPrompt : techMetadataPrompt;

    const metadataResponse = await gemini.invoke(metadataPrompt);
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
      tags: (parsedMetadata.tags || []).slice(0, 5),
      createdAt: currentDate,
      updatedAt: currentDate,
      // 재실행 시 slug를 유지한다. URL과 썸네일 경로가 흔들리지 않고, 제목만 바뀐 경우를 구분할 수 있다.
      slug: state.metadata?.slug ?? parsedMetadata.slug,
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
