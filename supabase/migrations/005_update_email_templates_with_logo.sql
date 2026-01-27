-- =============================================
-- Update Email Templates with Logo and Thumbnail
-- Created: 2026-01-27
-- =============================================

-- Update "구독 완료" template with logo
UPDATE email_templates
SET body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 32px 32px 24px; background-color: #0a0a0a;">
              <img src="https://hmkim-blog.vercel.app/icon.png" alt="HM Blog" width="48" height="48" style="display: block; border-radius: 8px;">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 24px; color: #0a0a0a; font-size: 20px; font-weight: 600; text-align: center;">
                구독을 환영합니다!
              </h1>

              <p style="margin: 0 0 16px; color: #0a0a0a; font-size: 15px; line-height: 1.7;">
                {{subscriber_name}}님, 안녕하세요.
              </p>

              <p style="margin: 0 0 24px; color: #525252; font-size: 15px; line-height: 1.7;">
                {{blog_name}} 뉴스레터를 구독해 주셔서 감사합니다.<br>
                새로운 글이 발행되면 이메일로 알려드리겠습니다.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://hmkim-blog.vercel.app"
                       style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: 500; border-radius: 8px;">
                      블로그 방문하기
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #737373; font-size: 12px; line-height: 1.6; text-align: center;">
                더 이상 이메일을 받고 싶지 않으시면<br>
                <a href="{{unsubscribe_url}}" style="color: #525252; text-decoration: underline;">구독을 취소</a>해 주세요.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
updated_at = now()
WHERE name = '구독 완료';

-- Update "새 글 알림" template with logo and thumbnail support
UPDATE email_templates
SET body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 32px 32px 24px; background-color: #0a0a0a;">
              <img src="https://hmkim-blog.vercel.app/icon.png" alt="HM Blog" width="48" height="48" style="display: block; border-radius: 8px;">
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 32px 0;">
              <p style="margin: 0 0 8px; color: #0a0a0a; font-size: 15px; line-height: 1.7;">
                안녕하세요, {{subscriber_name}}님!
              </p>
              <p style="margin: 0; color: #525252; font-size: 14px; line-height: 1.6;">
                {{blog_name}}에 새로운 글이 발행되었습니다.
              </p>
            </td>
          </tr>

          <!-- Thumbnail (conditional) -->
          <!--[if mso]>
          <tr>
            <td style="padding: 24px 32px 0;">
          <![endif]-->
          {{#if post_thumbnail}}
          <tr>
            <td style="padding: 24px 32px 0;">
              <a href="{{post_url}}" style="display: block; text-decoration: none;">
                <img src="{{post_thumbnail}}" alt="{{post_title}}" width="456" style="display: block; width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e5e5;">
              </a>
            </td>
          </tr>
          {{/if}}
          <!--[if mso]>
            </td>
          </tr>
          <![endif]-->

          <!-- Post Content -->
          <tr>
            <td style="padding: 24px 32px;">
              <h1 style="margin: 0 0 12px; color: #0a0a0a; font-size: 20px; font-weight: 600; line-height: 1.4;">
                <a href="{{post_url}}" style="color: #0a0a0a; text-decoration: none;">{{post_title}}</a>
              </h1>
              <p style="margin: 0 0 24px; color: #525252; font-size: 14px; line-height: 1.7;">
                {{post_summary}}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="{{post_url}}"
                       style="display: inline-block; background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: 500; border-radius: 8px;">
                      글 읽기
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #737373; font-size: 12px; line-height: 1.6; text-align: center;">
                더 이상 이메일을 받고 싶지 않으시면<br>
                <a href="{{unsubscribe_url}}" style="color: #525252; text-decoration: underline;">구독을 취소</a>해 주세요.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
updated_at = now()
WHERE name = '새 글 알림';
