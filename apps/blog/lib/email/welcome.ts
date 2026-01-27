import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const BLOG_NAME = "HM Blog";
const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_URL || "https://hmkim-blog.vercel.app";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn("GMAIL_USER or GMAIL_APP_PASSWORD is not set");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

async function getWelcomeTemplate(): Promise<EmailTemplate | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("name", "구독 완료")
    .single();

  if (error || !data) {
    console.warn("Welcome template not found in database");
    return null;
  }

  return data as EmailTemplate;
}

function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  return result;
}

export async function sendWelcomeEmail(
  email: string,
  name?: string | null
): Promise<{ success: boolean; error?: string }> {
  console.log("[Welcome Email] Starting for:", email);

  const transporter = getTransporter();

  if (!transporter) {
    console.error("[Welcome Email] FAILED: Email transporter not configured");
    return { success: false, error: "Email transporter not configured" };
  }

  const template = await getWelcomeTemplate();
  if (!template) {
    console.error("[Welcome Email] FAILED: Welcome template not found in database");
    return { success: false, error: "Welcome template not found" };
  }

  console.log("[Welcome Email] Template found:", template.name);

  const subscriberName = name?.trim() || "구독자";
  const fromEmail = process.env.GMAIL_USER;

  const variables: Record<string, string> = {
    blog_name: BLOG_NAME,
    subscriber_name: subscriberName,
    unsubscribe_url: `${BLOG_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`,
  };

  const subject = replaceVariables(template.subject, variables);
  const html = replaceVariables(template.body, variables);

  try {
    console.log("[Welcome Email] Sending to:", email, "from:", fromEmail);

    await transporter.sendMail({
      from: `"${BLOG_NAME}" <${fromEmail}>`,
      to: email,
      subject,
      html,
    });

    console.log("[Welcome Email] SUCCESS: Email sent to:", email);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Welcome Email] FAILED:", message);
    return { success: false, error: message };
  }
}
