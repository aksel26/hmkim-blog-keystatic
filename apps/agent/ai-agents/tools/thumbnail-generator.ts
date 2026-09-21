/**
 * Thumbnail Generator Tool
 * Gemini 2.5 Flash Image를 사용한 블로그 썸네일 자동 생성
 */

import { GoogleGenAI, Modality } from '@google/genai';
import type { PostMetadata, Category, OnProgressCallback } from '../types/workflow';
import { DEFAULT_THUMBNAIL_STYLE } from '../config/thumbnail-presets';

/**
 * 썸네일 생성 결과
 */
export interface ThumbnailResult {
  buffer: string; // base64 encoded
  mimeType: string;
  path: string; // e.g. "/images/thumbnails/{slug}/thumbnailImage.png"
}

// 프리셋 목록과 기본 화풍은 config/thumbnail-presets.ts에 있다 (화면에서도 함께 쓴다)
export { DEFAULT_THUMBNAIL_STYLE };

/**
 * 포스트 메타데이터 기반으로 썸네일 생성 프롬프트 구성
 */
export function buildPrompt(metadata: PostMetadata, _category: Category, style: string = DEFAULT_THUMBNAIL_STYLE): string {
  const keywords = metadata.keywords?.slice(0, 3).join(', ') || '';

  // 제목을 따옴표로 감싸 넘기면 이미지 모델이 "이 글자를 그려라"로 읽는다 (철자가 틀린 라벨이 그림에 들어갔다).
  // 제목과 키워드는 이해를 돕는 참고로만 넘기고, 글자 금지를 맨 앞에 둔다
  return `Create a text-free blog thumbnail illustration. The image must contain no letters, words, numbers, labels, captions, logos or UI text of any kind.
Topic of the article (for your understanding only, never write it in the image): ${metadata.title}
What the article explains: ${metadata.summary}
Key concepts to express through shapes and objects only: ${keywords}
Style: ${style}
Requirements:
- Aspect ratio: 16:9
- Professional quality suitable for a tech blog
- Simple composition with clear focal point
- Abstract or conceptual representation preferred over literal imagery`;
}

/**
 * 썸네일 이미지 생성
 *
 * best-effort: 실패하면 null을 돌려주고 워크플로우는 계속 진행한다.
 * 썸네일은 없어도 포스트를 낼 수 있고, 이미지 생성은 별도 SDK(@google/genai)라
 * LangChain의 재시도가 적용되지 않는다. 필요하면 Keystatic에서 나중에 넣는다.
 *
 * @param metadata 포스트 메타데이터 (제목, 요약, 키워드 등)
 * @param category 포스트 카테고리
 * @param onProgress 진행 상황 콜백 (선택)
 * @returns 썸네일 결과 또는 null (실패 시)
 */
export async function generateThumbnail(
  metadata: PostMetadata,
  category: Category,
  onProgress?: OnProgressCallback,
  style?: string,
): Promise<ThumbnailResult | null> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn('[Thumbnail] GOOGLE_API_KEY가 설정되지 않아 썸네일 생성을 건너뜁니다.');
      return null;
    }

    onProgress?.({
      step: 'thumbnail',
      status: 'started',
      message: '썸네일 이미지 생성 중...',
      progress: 65,
    });

    const ai = new GoogleGenAI({ apiKey });
    // 화풍은 Style 줄에만 들어간다. 예전에는 이 값이 프롬프트 전체를 대체해 제목, 요약, 요구사항이 모두 빠졌다
    const prompt = buildPrompt(metadata, category, style?.trim() || DEFAULT_THUMBNAIL_STYLE);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        // 비율은 프롬프트 문장으로는 지켜지지 않는다 (정사각형에 가깝게 나왔다). API 옵션으로 지정한다
        imageConfig: { aspectRatio: '16:9' },
      },
    });

    // 응답에서 이미지 파트 추출
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.warn('[Thumbnail] 응답에 콘텐츠가 없습니다.');
      onProgress?.({
        step: 'thumbnail',
        status: 'error',
        message: '썸네일 생성 실패: 응답에 콘텐츠가 없습니다.',
        progress: 65,
      });
      return null;
    }

    const imagePart = parts.find(
      (part) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData) {
      console.warn('[Thumbnail] 응답에 이미지가 없습니다.');
      onProgress?.({
        step: 'thumbnail',
        status: 'error',
        message: '썸네일 생성 실패: 이미지가 생성되지 않았습니다.',
        progress: 65,
      });
      return null;
    }

    const { data: base64Data, mimeType } = imagePart.inlineData;
    if (!base64Data || !mimeType) {
      console.warn('[Thumbnail] 이미지 데이터가 비어있습니다.');
      return null;
    }

    const slug = metadata.slug || 'new-post';
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const imagePath = `/images/thumbnails/${slug}/thumbnailImage.${extension}`;

    onProgress?.({
      step: 'thumbnail',
      status: 'completed',
      message: '썸네일 이미지 생성 완료!',
      progress: 70,
    });

    return {
      buffer: base64Data,
      mimeType,
      path: imagePath,
    };
  } catch (error) {
    console.error('[Thumbnail] 썸네일 생성 중 오류:', error);
    onProgress?.({
      step: 'thumbnail',
      status: 'error',
      message: `썸네일 생성 실패: ${error instanceof Error ? error.message : String(error)}`,
      progress: 65,
    });
    return null;
  }
}
