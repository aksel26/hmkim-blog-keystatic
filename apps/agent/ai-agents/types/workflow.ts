/**
 * AI Multi-Agent Blog Workflow Type Definitions
 */

/**
 * 리서치 결과 데이터 구조
 */
export interface ResearchData {
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  summary: string;
  keyPoints: string[];
}

/**
 * 블로그 포스트 메타데이터
 * Keystatic 형식에 맞춘 메타데이터 구조
 */
export interface PostMetadata {
  title: string;
  summary: string;
  keywords: string[];
  status: 'draft' | 'published';
  tags: string[];
  createdAt: string; // YYYY-MM-DD
  updatedAt: string; // YYYY-MM-DD
  slug: string;
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  passed: boolean;
  errors: string[];
}

/**
 * 카테고리 타입
 */
export type Category = 'tech' | 'life';

/**
 * 워크플로우 전체 상태 관리
 */
export interface BlogPostState {
  // 기본 정보
  topic: string;
  category?: Category;
  currentStep: string;
  progress: number; // 0-100

  // 리서치 데이터
  researchData?: ResearchData;

  // 콘텐츠
  draftContent?: string;
  finalContent?: string;
  images?: string[];

  // 사람 검토
  humanApproval?: boolean;
  humanFeedback?: string;

  // 메타데이터
  metadata?: PostMetadata;

  // 파일 정보
  filepath?: string;

  // 검증
  validationResult?: ValidationResult;

  // Git 정보
  commitHash?: string;
}

/**
 * 진행 상황 이벤트 상태
 */
export type EventStatus = 'started' | 'progress' | 'completed' | 'error';

/**
 * 진행 상황 이벤트
 */
export interface StreamEvent {
  step: string;
  status: EventStatus;
  message: string;
  progress?: number; // 0-100, 워크플로우 전체 진행률
  data?: any;
}

/**
 * 진행 상황 콜백 타입
 * async 콜백을 지원하여 DB 업데이트 등이 완료될 때까지 대기 가능
 */
export type OnProgressCallback = (event: StreamEvent) => void | Promise<void>;
