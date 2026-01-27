import { NextRequest, NextResponse } from "next/server";
import { sendNewsletter, sendTestEmail } from "@/lib/email/sender";
import type { SendNewsletterRequest } from "@/lib/email/types";

// API 키 검증
function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.NEWSLETTER_API_KEY;

  if (!expectedKey) {
    console.warn("NEWSLETTER_API_KEY is not set");
    return false;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const providedKey = authHeader.slice(7);
  return providedKey === expectedKey;
}

export async function POST(request: NextRequest) {
  try {
    // API 키 검증
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: SendNewsletterRequest & { test?: boolean; testEmail?: string } =
      await request.json();

    // 필수 필드 검증
    if (!body.postTitle || !body.postSummary || !body.postUrl) {
      return NextResponse.json(
        { error: "postTitle, postSummary, and postUrl are required" },
        { status: 400 }
      );
    }

    // 테스트 모드
    if (body.test && body.testEmail) {
      const result = await sendTestEmail(body.testEmail, {
        postTitle: body.postTitle,
        postSummary: body.postSummary,
        postUrl: body.postUrl,
        postThumbnail: body.postThumbnail,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Test email sent to ${body.testEmail}`,
      });
    }

    // 실제 뉴스레터 발송
    const result = await sendNewsletter({
      postTitle: body.postTitle,
      postSummary: body.postSummary,
      postUrl: body.postUrl,
      postCategory: body.postCategory,
      postThumbnail: body.postThumbnail,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Newsletter send error:", error);
    const message = error instanceof Error ? error.message : "Failed to send newsletter";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
