import { Resend } from "resend";
import { subscriberManager } from "@/lib/subscribers/manager";
import { templateManager } from "@/lib/templates/manager";
import type { SendNewsletterRequest, SendNewsletterResult, EmailVariables } from "./types";

const BLOG_NAME = "HM Blog";
const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_URL || "https://hmkim.blog";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "newsletter@hmkim.blog";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

function replaceVariables(template: string, variables: EmailVariables): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  return result;
}

export async function sendNewsletter(
  request: SendNewsletterRequest
): Promise<SendNewsletterResult> {
  const resend = getResend();

  // 활성 구독자 조회
  const subscribers = await subscriberManager.getActiveSubscribers();

  if (subscribers.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  // 기본 템플릿 가져오기
  const template = await templateManager.getDefaultTemplate();
  if (!template) {
    throw new Error("No default email template found");
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // 각 구독자에게 이메일 발송
  for (const subscriber of subscribers) {
    const variables: EmailVariables = {
      blog_name: BLOG_NAME,
      post_title: request.postTitle,
      post_summary: request.postSummary,
      post_url: request.postUrl,
      subscriber_name: subscriber.name || "구독자",
      unsubscribe_url: `${BLOG_URL}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}`,
    };

    const subject = replaceVariables(template.subject, variables);
    const html = replaceVariables(template.body, variables);

    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: subscriber.email,
        subject,
        html,
      });

      if (error) {
        failed++;
        errors.push(`${subscriber.email}: ${error.message}`);
      } else {
        sent++;
      }
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${subscriber.email}: ${message}`);
    }

    // Rate limiting - Resend free tier: 100 emails/day, 1 email/second
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  return {
    success: failed === 0,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function sendTestEmail(
  to: string,
  request: SendNewsletterRequest
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();

  const template = await templateManager.getDefaultTemplate();
  if (!template) {
    return { success: false, error: "No default email template found" };
  }

  const variables: EmailVariables = {
    blog_name: BLOG_NAME,
    post_title: request.postTitle,
    post_summary: request.postSummary,
    post_url: request.postUrl,
    subscriber_name: "테스트 사용자",
    unsubscribe_url: `${BLOG_URL}/api/unsubscribe?email=${encodeURIComponent(to)}`,
  };

  const subject = `[TEST] ${replaceVariables(template.subject, variables)}`;
  const html = replaceVariables(template.body, variables);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
