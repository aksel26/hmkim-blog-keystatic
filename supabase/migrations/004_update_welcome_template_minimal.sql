-- =============================================
-- Update Welcome Email Template to Clean Minimal Design
-- Created: 2026-01-27
-- =============================================

UPDATE email_templates
SET
  subject = '{{blog_name}} 뉴스레터 구독을 환영합니다',
  body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" style="max-width: 520px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; border-bottom: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #0a0a0a; font-size: 18px; font-weight: 600;">{{blog_name}}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 0;">
              <p style="margin: 0 0 24px; color: #0a0a0a; font-size: 15px; line-height: 1.6;">
                {{subscriber_name}}님, 안녕하세요.
              </p>

              <p style="margin: 0 0 24px; color: #0a0a0a; font-size: 15px; line-height: 1.6;">
                {{blog_name}} 뉴스레터를 구독해 주셔서 감사합니다.<br>
                새로운 글이 발행되면 이메일로 알려드리겠습니다.
              </p>

              <a href="https://hmkim-blog.vercel.app"
                 style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 14px; font-weight: 500;">
                블로그 방문
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #737373; font-size: 12px; line-height: 1.6;">
                더 이상 이메일을 받고 싶지 않으시면 <a href="{{unsubscribe_url}}" style="color: #737373;">구독을 취소</a>해 주세요.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  updated_at = NOW()
WHERE name = '구독 완료';
