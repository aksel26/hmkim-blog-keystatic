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
