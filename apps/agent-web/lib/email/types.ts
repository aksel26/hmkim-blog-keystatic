export interface SendNewsletterRequest {
  postTitle: string;
  postSummary: string;
  postUrl: string;
  postCategory?: string;
}

export interface SendNewsletterResult {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
}

export interface EmailVariables {
  blog_name: string;
  post_title: string;
  post_summary: string;
  post_url: string;
  subscriber_name: string;
  unsubscribe_url: string;
}
