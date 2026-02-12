import { createServerClient } from "@/lib/supabase/client";
import type { JobStatus, Category, GenerateRequest } from "@/lib/types";

// Database row types (snake_case from Supabase)
interface DbJob {
  id: string;
  topic: string;
  category: string;
  template: string | null;
  status: string;
  current_step: string | null;
  progress: number;
  research_data: unknown | null;
  draft_content: string | null;
  final_content: string | null;
  metadata: unknown | null;
  review_result: unknown | null;
  validation_result: unknown | null;
  human_approval: boolean | null;
  human_feedback: string | null;
  thumbnail_data: string | null;
  filepath: string | null;
  pr_result: unknown | null;
  commit_hash: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

interface DbProgressLog {
  id: number;
  job_id: string;
  step: string;
  status: string;
  message: string;
  data: unknown | null;
  created_at: string;
}

/**
 * Job Manager - Handles job CRUD operations and workflow integration
 */
export class JobManager {
  private _supabase: ReturnType<typeof createServerClient> | null = null;

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createServerClient();
    }
    return this._supabase;
  }

  /**
   * Create a new job
   */
  async createJob(request: GenerateRequest): Promise<DbJob> {
    const jobData = {
      topic: request.topic,
      category: request.category || "tech",
      template: request.template || null,
      status: "queued",
      progress: 0,
    };

    const { data, error } = await this.supabase
      .from("jobs")
      .insert(jobData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return data as DbJob;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<DbJob | null> {
    const { data, error } = await this.supabase
      .from("jobs")
      .select()
      .eq("id", jobId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to get job: ${error.message}`);
    }

    return data as DbJob;
  }

  /**
   * List jobs with pagination and filtering
   */
  async listJobs(options: {
    page?: number;
    limit?: number;
    status?: JobStatus;
    category?: Category;
    search?: string;
  } = {}): Promise<{ jobs: DbJob[]; total: number }> {
    const { page = 1, limit = 10, status, category, search } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.ilike("topic", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list jobs: ${error.message}`);
    }

    return {
      jobs: (data || []) as DbJob[],
      total: count || 0,
    };
  }

  /**
   * Update job status and data
   */
  async updateJob(jobId: string, updates: Partial<DbJob>): Promise<DbJob> {
    const { data, error } = await this.supabase
      .from("jobs")
      .update(updates)
      .eq("id", jobId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }

    return data as DbJob;
  }

  /**
   * Update job status
   */
  async updateStatus(
    jobId: string,
    status: JobStatus,
    currentStep?: string,
    progress?: number
  ): Promise<DbJob> {
    return this.updateJob(jobId, {
      status,
      current_step: currentStep,
      progress,
    });
  }

  /**
   * Set job error
   */
  async setError(jobId: string, error: string): Promise<DbJob> {
    return this.updateJob(jobId, {
      status: "failed",
      error,
    });
  }

  /**
   * Complete job with results
   */
  async completeJob(
    jobId: string,
    results: {
      finalContent?: string;
      metadata?: Record<string, unknown>;
      filepath?: string;
      prResult?: Record<string, unknown>;
      commitHash?: string;
    }
  ): Promise<DbJob> {
    return this.updateJob(jobId, {
      status: "completed",
      progress: 100,
      final_content: results.finalContent,
      metadata: results.metadata,
      filepath: results.filepath,
      pr_result: results.prResult,
      commit_hash: results.commitHash,
    });
  }

  /**
   * Log progress event
   */
  async logProgress(
    jobId: string,
    event: {
      step: string;
      status: "started" | "progress" | "completed" | "error";
      message: string;
      data?: Record<string, unknown>;
    }
  ): Promise<void> {
    const logData = {
      job_id: jobId,
      step: event.step,
      status: event.status,
      message: event.message,
      data: event.data || null,
    };

    const { error } = await this.supabase.from("progress_logs").insert(logData);

    if (error) {
      console.error(`Failed to log progress: ${error.message}`);
    }
  }

  /**
   * Get progress logs for a job
   */
  async getProgressLogs(
    jobId: string
  ): Promise<Array<{
    id: number;
    step: string;
    status: string;
    message: string;
    data: Record<string, unknown> | null;
    createdAt: string;
  }>> {
    const { data, error } = await this.supabase
      .from("progress_logs")
      .select()
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to get progress logs: ${error.message}`);
    }

    return ((data || []) as DbProgressLog[]).map((log) => ({
      id: log.id,
      step: log.step,
      status: log.status,
      message: log.message,
      data: log.data as Record<string, unknown> | null,
      createdAt: log.created_at,
    }));
  }

  /**
   * Submit human review
   */
  async submitHumanReview(
    jobId: string,
    approved: boolean,
    feedback?: string
  ): Promise<DbJob> {
    return this.updateJob(jobId, {
      human_approval: approved,
      human_feedback: feedback || null,
      status: approved ? "creating" : "writing",
    });
  }

  /**
   * Get dashboard stats
   */
  async getStats(): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingReviews: number;
    successRate: number;
  }> {
    const { data: jobs, error } = await this.supabase
      .from("jobs")
      .select("status");

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const jobList = (jobs || []) as Array<{ status: string }>;
    const totalJobs = jobList.length;
    const completedJobs = jobList.filter((j) => j.status === "completed").length;
    const failedJobs = jobList.filter((j) => j.status === "failed").length;
    const pendingReviews = jobList.filter((j) => j.status === "human_review").length;

    const finishedJobs = completedJobs + failedJobs;
    const successRate = finishedJobs > 0 ? (completedJobs / finishedJobs) * 100 : 0;

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      pendingReviews,
      successRate: Math.round(successRate),
    };
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(limit: number = 5): Promise<DbJob[]> {
    const { data, error } = await this.supabase
      .from("jobs")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get recent jobs: ${error.message}`);
    }

    return (data || []) as DbJob[];
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    const { error } = await this.supabase.from("jobs").delete().eq("id", jobId);

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }
}

// Singleton instance
export const jobManager = new JobManager();
