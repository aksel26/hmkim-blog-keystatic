import { createServerClient } from "@/lib/supabase/client";
import type { Subscriber, SubscribersListResponse, SubscriberStats } from "./types";

export class SubscriberManager {
  private supabase = createServerClient();

  async listSubscribers(options: {
    page?: number;
    limit?: number;
    status?: "active" | "unsubscribed";
    search?: string;
  }): Promise<SubscribersListResponse> {
    const { page = 1, limit = 20, status, search } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from("subscribers")
      .select("*", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list subscribers: ${error.message}`);
    }

    return {
      subscribers: data as Subscriber[],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async getSubscriber(id: string): Promise<Subscriber | null> {
    const { data, error } = await this.supabase
      .from("subscribers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get subscriber: ${error.message}`);
    }

    return data as Subscriber;
  }

  async updateSubscriber(
    id: string,
    updates: { name?: string; status?: "active" | "unsubscribed" }
  ): Promise<Subscriber> {
    const updateData: Record<string, unknown> = { ...updates };

    if (updates.status === "unsubscribed") {
      updateData.unsubscribed_at = new Date().toISOString();
    } else if (updates.status === "active") {
      updateData.unsubscribed_at = null;
    }

    const { data, error } = await this.supabase
      .from("subscribers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subscriber: ${error.message}`);
    }

    return data as Subscriber;
  }

  async deleteSubscriber(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete subscriber: ${error.message}`);
    }
  }

  async getStats(): Promise<SubscriberStats> {
    const { data, error } = await this.supabase
      .from("subscribers")
      .select("status");

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      active: data.filter((s) => s.status === "active").length,
      unsubscribed: data.filter((s) => s.status === "unsubscribed").length,
    };

    return stats;
  }

  async getActiveSubscribers(): Promise<Subscriber[]> {
    const { data, error } = await this.supabase
      .from("subscribers")
      .select("*")
      .eq("status", "active");

    if (error) {
      throw new Error(`Failed to get active subscribers: ${error.message}`);
    }

    return data as Subscriber[];
  }
}

export const subscriberManager = new SubscriberManager();
