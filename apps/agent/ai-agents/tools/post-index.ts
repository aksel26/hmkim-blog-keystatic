/**
 * 블로그에 이미 올라간 글 목록. creator가 본문에 내부 링크를 걸 때 쓴다.
 * 배포된 블로그의 공개 RSS(/feed.xml)를 읽는다. 링크는 실제로 열리는 글만 걸어야 하므로
 * 개발용 NEXT_PUBLIC_SITE_URL(localhost)이 아니라 BLOG_SITE_URL, 없으면 운영 주소를 쓴다.
 * 읽지 못하면 빈 목록을 돌려주고 글 생성은 그대로 진행한다.
 */

export interface ExistingPost {
  title: string;
  path: string; // 예: /tech/claude-code-hooks
}

function unescapeXml(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

export function parseFeed(xml: string): ExistingPost[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.flatMap((item) => {
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    if (!title || !link) return [];
    try {
      return [{ title: unescapeXml(title), path: new URL(link).pathname }];
    } catch {
      return [];
    }
  });
}

export async function loadExistingPosts(
  siteUrl = process.env.BLOG_SITE_URL || 'https://hmkim.blog'
): Promise<ExistingPost[]> {
  if (!siteUrl) return [];
  try {
    const res = await fetch(new URL('/feed.xml', siteUrl), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    return parseFeed(await res.text());
  } catch {
    return [];
  }
}
