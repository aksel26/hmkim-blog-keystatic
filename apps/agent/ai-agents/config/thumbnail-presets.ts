/**
 * 썸네일 스타일 프리셋
 *
 * 프리셋은 "무엇을 그릴지"가 아니라 "어떤 화풍으로 그릴지"만 정한다. 그릴 내용(제목, 요약, 키워드)과
 * 요구사항(16:9, 글자 없음)은 thumbnail-generator의 buildPrompt가 붙인다.
 * 프리셋을 추가하거나 고치려면 이 배열만 손보면 된다. 첫 항목이 기본값이다.
 * 의존성이 없는 데이터 파일이라 agent-web의 클라이언트 컴포넌트에서도 그대로 import한다.
 */
export interface ThumbnailPreset {
  id: string;
  name: string; // 화면에 보이는 이름
  style: string; // 이미지 모델에 넘기는 화풍 설명 (영문이 결과가 안정적이다)
}

export const THUMBNAIL_PRESETS: ThumbnailPreset[] = [
  { id: 'clay', name: '클레이', style: 'clay morphism style, isometric, pastel tone gradient background' },
  { id: 'line', name: '라인 드로잉', style: 'minimal line art, thin black strokes on a white background, generous negative space, single accent shape' },
  { id: 'flat', name: '플랫 일러스트', style: 'flat vector illustration, bold geometric shapes, limited color palette, clean edges' },
  { id: 'glass', name: '글래스 3D', style: 'glassmorphism 3D render, translucent frosted glass shapes, soft studio lighting, subtle gradient background' },
  { id: 'paper', name: '페이퍼 컷', style: 'layered paper cut craft style, soft drop shadows between layers, muted colors' },
  { id: 'mono', name: '흑백 사진', style: 'black and white editorial photography, high contrast, shallow depth of field, minimal composition' },
];

export const DEFAULT_THUMBNAIL_STYLE = THUMBNAIL_PRESETS[0].style;
