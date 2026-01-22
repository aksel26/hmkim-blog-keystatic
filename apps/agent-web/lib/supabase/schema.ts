/**
 * Supabase Database Schema Types
 * Auto-generated types for Supabase tables
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      subscribers: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          status: "active" | "unsubscribed";
          privacy_agreed_at: string;
          subscribed_at: string;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          status?: "active" | "unsubscribed";
          privacy_agreed_at: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          status?: "active" | "unsubscribed";
          privacy_agreed_at?: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_templates: {
        Row: {
          id: string;
          name: string;
          subject: string;
          body: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          body: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          body?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          topic: string;
          category: string;
          template: string | null;
          status: string;
          current_step: string | null;
          progress: number;
          research_data: Json | null;
          draft_content: string | null;
          final_content: string | null;
          metadata: Json | null;
          review_result: Json | null;
          validation_result: Json | null;
          human_approval: boolean | null;
          human_feedback: string | null;
          filepath: string | null;
          pr_result: Json | null;
          commit_hash: string | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic: string;
          category?: string;
          template?: string | null;
          status?: string;
          current_step?: string | null;
          progress?: number;
          research_data?: Json | null;
          draft_content?: string | null;
          final_content?: string | null;
          metadata?: Json | null;
          review_result?: Json | null;
          validation_result?: Json | null;
          human_approval?: boolean | null;
          human_feedback?: string | null;
          filepath?: string | null;
          pr_result?: Json | null;
          commit_hash?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic?: string;
          category?: string;
          template?: string | null;
          status?: string;
          current_step?: string | null;
          progress?: number;
          research_data?: Json | null;
          draft_content?: string | null;
          final_content?: string | null;
          metadata?: Json | null;
          review_result?: Json | null;
          validation_result?: Json | null;
          human_approval?: boolean | null;
          human_feedback?: string | null;
          filepath?: string | null;
          pr_result?: Json | null;
          commit_hash?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      progress_logs: {
        Row: {
          id: number;
          job_id: string;
          step: string;
          status: string;
          message: string;
          data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          job_id: string;
          step: string;
          status: string;
          message: string;
          data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          job_id?: string;
          step?: string;
          status?: string;
          message?: string;
          data?: Json | null;
          created_at?: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          topic_source: "manual" | "rss" | "ai_suggest";
          topic_list: string[] | null;
          topic_index: number;
          rss_url: string | null;
          ai_prompt: string | null;
          category: "tech" | "life";
          template: string;
          target_reader: string | null;
          keywords: string[] | null;
          auto_approve: boolean;
          cron_expression: string;
          timezone: string;
          enabled: boolean;
          last_run_at: string | null;
          next_run_at: string | null;
          last_job_id: string | null;
          run_count: number;
          error_count: number;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          topic_source?: "manual" | "rss" | "ai_suggest";
          topic_list?: string[] | null;
          topic_index?: number;
          rss_url?: string | null;
          ai_prompt?: string | null;
          category?: "tech" | "life";
          template?: string;
          target_reader?: string | null;
          keywords?: string[] | null;
          auto_approve?: boolean;
          cron_expression: string;
          timezone?: string;
          enabled?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          last_job_id?: string | null;
          run_count?: number;
          error_count?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          topic_source?: "manual" | "rss" | "ai_suggest";
          topic_list?: string[] | null;
          topic_index?: number;
          rss_url?: string | null;
          ai_prompt?: string | null;
          category?: "tech" | "life";
          template?: string;
          target_reader?: string | null;
          keywords?: string[] | null;
          auto_approve?: boolean;
          cron_expression?: string;
          timezone?: string;
          enabled?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          last_job_id?: string | null;
          run_count?: number;
          error_count?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];
export type JobUpdate = Database["public"]["Tables"]["jobs"]["Update"];

export type ProgressLog = Database["public"]["Tables"]["progress_logs"]["Row"];
export type ProgressLogInsert = Database["public"]["Tables"]["progress_logs"]["Insert"];

export type Subscriber = Database["public"]["Tables"]["subscribers"]["Row"];
export type SubscriberInsert = Database["public"]["Tables"]["subscribers"]["Insert"];
export type SubscriberUpdate = Database["public"]["Tables"]["subscribers"]["Update"];

export type EmailTemplate = Database["public"]["Tables"]["email_templates"]["Row"];
export type EmailTemplateInsert = Database["public"]["Tables"]["email_templates"]["Insert"];
export type EmailTemplateUpdate = Database["public"]["Tables"]["email_templates"]["Update"];

export type Schedule = Database["public"]["Tables"]["schedules"]["Row"];
export type ScheduleInsert = Database["public"]["Tables"]["schedules"]["Insert"];
export type ScheduleUpdate = Database["public"]["Tables"]["schedules"]["Update"];
