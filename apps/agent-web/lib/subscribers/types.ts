import type { Subscriber } from "@/lib/supabase/schema";

export type { Subscriber };

export interface SubscribersListResponse {
  subscribers: Subscriber[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
}
