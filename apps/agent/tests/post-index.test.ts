/**
 * 블로그 RSS에서 기존 글 목록(제목, 경로)을 뽑는지 검사
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadExistingPosts, parseFeed } from '../ai-agents/tools/post-index';

test('RSS item에서 제목과 경로를 뽑고 XML 이스케이프를 푼다', () => {
  const xml = `<rss><channel><title>HM Blog</title><link>https://hmkim.blog</link>
    <item><title>Tom &amp; Jerry &apos;s</title><link>https://hmkim.blog/tech/a-b</link></item>
    <item><title>둘째</title><link>https://hmkim.blog/life/c</link></item>
    <item><title>링크 없음</title></item>
  </channel></rss>`;
  assert.deepEqual(parseFeed(xml), [
    { title: "Tom & Jerry 's", path: '/tech/a-b' },
    { title: '둘째', path: '/life/c' },
  ]);
});

test('사이트 주소가 없으면 요청 없이 빈 목록을 돌려준다', async () => {
  assert.deepEqual(await loadExistingPosts(''), []);
});
