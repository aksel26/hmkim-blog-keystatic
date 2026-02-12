import { z } from "zod";

/**
 * 공통 필드 스키마
 */
export const commonFieldsSchema = z.object({
  tone: z.string().min(1, "말투를 선택하거나 입력해주세요"),
  targetReader: z.string().min(2, "타겟 독자를 입력해주세요"),
});

/**
 * Tech 카테고리 스키마
 */
export const techSchema = z.object({
  category: z.literal("tech"),
  topic: z.string().min(5, "주제를 5자 이상 입력해주세요"),
  template: z.enum(["tutorial", "comparison", "deep-dive", "tips", "default"]).optional(),
  tone: z.string().optional(),
  targetReader: z.string().optional(),
});

/**
 * Life 카테고리 스키마
 */
export const lifeSchema = z.object({
  category: z.literal("life"),
  topic: z.string().min(5, "주제를 5자 이상 입력해주세요"),
  template: z.enum(["tutorial", "comparison", "deep-dive", "tips", "default"]).optional(),
  tone: z.string().optional(),
  targetReader: z.string().optional(),
});

/**
 * 통합 폼 스키마 (discriminated union)
 */
export const blogFormSchema = z.discriminatedUnion("category", [
  techSchema,
  lifeSchema,
]);

export type BlogFormData = z.infer<typeof blogFormSchema>;
export type TechFormData = z.infer<typeof techSchema>;
export type LifeFormData = z.infer<typeof lifeSchema>;

/**
 * 카테고리 옵션 정의
 */
export const categoryOptions = [
  { value: "tech", label: "Tech", description: "기술 관련 포스트" },
  { value: "life", label: "Life", description: "일상/라이프스타일" },
] as const;

/**
 * 톤 프리셋 옵션 정의
 */
export const tonePresets = [
  { value: "formal", label: "격식체", description: "정중하고 전문적인 어조" },
  { value: "casual", label: "편한체", description: "친근하고 편안한 어조" },
  { value: "friendly", label: "친근체", description: "다정하고 따뜻한 어조" },
  { value: "professional", label: "전문가체", description: "권위있는 전문가 어조" },
] as const;

/**
 * @deprecated toneOptions는 tonePresets로 이름 변경
 */
export const toneOptions = tonePresets;

/**
 * 템플릿 옵션 정의
 */
export const templateOptions = [
  { value: "default", label: "기본", description: "일반적인 블로그 포스트" },
  { value: "tutorial", label: "튜토리얼", description: "단계별 가이드, How-to 콘텐츠" },
  { value: "comparison", label: "비교 분석", description: "두 가지 이상 옵션 비교 분석" },
  { value: "deep-dive", label: "심층 분석", description: "특정 주제 심층 분석" },
  { value: "tips", label: "팁 모음", description: "빠른 팁과 트릭 모음" },
] as const;
