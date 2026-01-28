/**
 * Supabase Database Schema Types for Blog
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PostCategory = "tech" | "life";

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
      comments: {
        Row: {
          id: number;
          post_slug: string;
          post_category: PostCategory;
          parent_id: number | null;
          author_name: string;
          author_email: string | null;
          password_hash: string;
          content: string;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          post_slug: string;
          post_category: PostCategory;
          parent_id?: number | null;
          author_name: string;
          author_email?: string | null;
          password_hash: string;
          content: string;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          post_slug?: string;
          post_category?: PostCategory;
          parent_id?: number | null;
          author_name?: string;
          author_email?: string | null;
          password_hash?: string;
          content?: string;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_views: {
        Row: {
          id: number;
          post_category: PostCategory;
          post_slug: string;
          view_count: number;
          unique_view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          post_category: PostCategory;
          post_slug: string;
          view_count?: number;
          unique_view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          post_category?: PostCategory;
          post_slug?: string;
          view_count?: number;
          unique_view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_view_logs: {
        Row: {
          id: number;
          post_category: string;
          post_slug: string;
          visitor_id: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          referrer: string | null;
          viewed_at: string;
        };
        Insert: {
          post_category: string;
          post_slug: string;
          visitor_id?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          viewed_at?: string;
        };
        Update: {
          post_category?: string;
          post_slug?: string;
          visitor_id?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          viewed_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_view_count: {
        Args: {
          p_category: string;
          p_slug: string;
          p_visitor_id?: string | null;
          p_ip_hash?: string | null;
          p_user_agent?: string | null;
          p_referrer?: string | null;
        };
        Returns: {
          view_count: number;
          unique_view_count: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Subscriber = Database["public"]["Tables"]["subscribers"]["Row"];
export type SubscriberInsert = Database["public"]["Tables"]["subscribers"]["Insert"];
export type SubscriberUpdate = Database["public"]["Tables"]["subscribers"]["Update"];

export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
export type CommentUpdate = Database["public"]["Tables"]["comments"]["Update"];

export type PostView = Database["public"]["Tables"]["post_views"]["Row"];
export type PostViewInsert = Database["public"]["Tables"]["post_views"]["Insert"];
export type PostViewUpdate = Database["public"]["Tables"]["post_views"]["Update"];

export type PostViewLog = Database["public"]["Tables"]["post_view_logs"]["Row"];
export type PostViewLogInsert = Database["public"]["Tables"]["post_view_logs"]["Insert"];

// 댓글 with 대댓글 수
export interface CommentWithReplies extends Comment {
  reply_count?: number;
  replies?: Comment[];
}
