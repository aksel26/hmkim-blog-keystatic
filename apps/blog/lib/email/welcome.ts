import nodemailer from "nodemailer";

const BLOG_NAME = "HM Blog";
const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_URL || "https://hmkim.blog";

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

function getWelcomeEmailHtml(subscriberName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${BLOG_NAME}</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Newsletter</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">
                환영합니다, ${subscriberName}님! 🎉
              </h2>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${BLOG_NAME} 뉴스레터를 구독해 주셔서 감사합니다.
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                앞으로 새로운 글이 발행될 때마다 이메일로 알려드리겠습니다.
                기술, 개발, 그리고 다양한 인사이트를 담은 콘텐츠를 기대해 주세요.
              </p>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${BLOG_URL}"
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  블로그 방문하기
                </a>
              </div>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                궁금한 점이 있으시면 언제든 답장해 주세요.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                ${BLOG_NAME}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                <a href="${BLOG_URL}/api/unsubscribe?email={{email}}" style="color: #9ca3af;">구독 취소</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendWelcomeEmail(
  email: string,
  name?: string | null
): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log("Email transporter not configured, skipping welcome email");
    return { success: true }; // 설정되지 않은 경우 조용히 성공 처리
  }

  const subscriberName = name?.trim() || "구독자";
  const fromEmail = process.env.GMAIL_USER;

  const html = getWelcomeEmailHtml(subscriberName).replace("{{email}}", encodeURIComponent(email));

  try {
    await transporter.sendMail({
      from: `"${BLOG_NAME}" <${fromEmail}>`,
      to: email,
      subject: `${BLOG_NAME} 뉴스레터 구독을 환영합니다! 🎉`,
      html,
    });

    console.log("Welcome email sent to:", email);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send welcome email:", message);
    return { success: false, error: message };
  }
}
