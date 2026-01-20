/**
 * Job status types
 */
export type JobStatus =
  | "queued"
  | "research"
  | "writing"
  | "review"
  | "human_review"
  | "creating"
  | "validating"
  | "deploying"
  | "completed"
  | "failed";

/**
 * Category types
 */
export type Category = "tech" | "life";

/**
 * Template types
 */
export type Template = "tutorial" | "comparison" | "deep-dive" | "tips" | "default";

/**
 * Research data structure
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
 * Post metadata
 */
export interface PostMetadata {
  title: string;
  summary: string;
  keywords: string[];
  status: "draft" | "published";
  tags: string[];
  createdAt: string;
  updatedAt: string;
  slug: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  passed: boolean;
  errors: string[];
}

/**
 * Review result
 */
export interface ReviewResult {
  seoScore: number;
  techAccuracy: number;
  suggestions: string[];
  issues: string[];
}

/**
 * PR result
 */
export interface PRResult {
  prNumber: number;
  prUrl: string;
  branchName: string;
}

/**
 * Human review action
 */
export type HumanReviewAction = "approve" | "feedback" | "rewrite";

/**
 * Job entity
 */
export interface Job {
  id: string;
  topic: string;
  category: Category;
  template: Template | null;
  status: JobStatus;
  currentStep: string | null;
  progress: number;

  // State data
  researchData: ResearchData | null;
  draftContent: string | null;
  finalContent: string | null;
  metadata: PostMetadata | null;
  reviewResult: ReviewResult | null;
  validationResult: ValidationResult | null;

  // Human review
  humanApproval: boolean | null;
  humanFeedback: string | null;

  // Output
  filepath: string | null;
  prResult: PRResult | null;
  commitHash: string | null;
  error: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * Progress log entry
 */
export interface ProgressLog {
  id: number;
  jobId: string;
  step: string;
  status: "started" | "progress" | "completed" | "error";
  message: string;
  data: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * SSE event types
 */
export type SSEEventType =
  | "progress"
  | "review-required"
  | "complete"
  | "error";

export interface SSEProgressEvent {
  type: "progress";
  step: string;
  status: string;
  message: string;
  progress: number;
}

export interface SSEReviewRequiredEvent {
  type: "review-required";
  draftContent: string;
  reviewResult: ReviewResult;
}

export interface SSECompleteEvent {
  type: "complete";
  filepath: string;
  prResult: PRResult | null;
  metadata: PostMetadata;
}

export interface SSEErrorEvent {
  type: "error";
  message: string;
  step: string;
}

export type SSEEvent =
  | SSEProgressEvent
  | SSEReviewRequiredEvent
  | SSECompleteEvent
  | SSEErrorEvent;

/**
 * API request/response types
 */
export interface GenerateRequest {
  topic: string;
  category?: Category;
  template?: Template;
  autoApprove?: boolean;
}

export interface GenerateResponse {
  jobId: string;
  status: "queued";
  streamUrl: string;
}

export interface JobsListResponse {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HumanReviewRequest {
  action: HumanReviewAction;
  feedback?: string;
}

export interface HumanReviewResponse {
  success: boolean;
  nextStep: string;
}

/**
 * Dashboard stats
 */
export interface DashboardStats {
  totalJobs: number;
  successRate: number;
  avgDuration: number;
  pendingReviews: number;
}
