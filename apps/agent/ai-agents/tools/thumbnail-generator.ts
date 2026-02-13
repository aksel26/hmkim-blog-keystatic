/**
 * Thumbnail Generator Tool
 * Gemini 2.5 Flash Image를 사용한 블로그 썸네일 자동 생성
 */

import { GoogleGenAI, Modality } from '@google/genai';
import type { PostMetadata, Category, OnProgressCallback } from '../types/workflow';

/**
 * 썸네일 생성 결과
 */
export interface ThumbnailResult {
  buffer: string; // base64 encoded
  mimeType: string;
  path: string; // e.g. "/images/thumbnails/{slug}/thumbnailImage.png"
}

/**
 * 기본 썸네일 스타일 프롬프트
 */
export const DEFAULT_THUMBNAIL_STYLE =
  'clay morphism style, isometric, pastel tone gradient background';

/**
 * 포스트 메타데이터 기반으로 썸네일 생성 프롬프트 구성
 */
function buildPrompt(metadata: PostMetadata, _category: Category): string {
  const keywords = metadata.keywords?.slice(0, 3).join(', ') || '';

  return `Create a blog thumbnail image for an article titled "${metadata.title}".
The image should visually represent: ${metadata.summary}
Key concepts: ${keywords}
Style: ${DEFAULT_THUMBNAIL_STYLE}
Requirements:
- Aspect ratio: 16:9
- No text or typography in the image
- Professional quality suitable for a tech blog
- Simple composition with clear focal point
- Abstract or conceptual representation preferred over literal imagery`;
}

/**
 * 썸네일 이미지 생성
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
  customPrompt?: string,
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
    const prompt = customPrompt || buildPrompt(metadata, category);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
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
