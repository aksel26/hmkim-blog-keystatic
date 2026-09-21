/**
 * 썸네일 프롬프트 구성 검사. 화풍(style)은 Style 줄에만 들어가고 그릴 내용과 요구사항은 남아야 한다.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPrompt } from '../ai-agents/tools/thumbnail-generator';
import { DEFAULT_THUMBNAIL_STYLE, THUMBNAIL_PRESETS } from '../ai-agents/config/thumbnail-presets';

const metadata = { title: '제목입니다', summary: '요약입니다', keywords: ['Tech', 'React'], status: 'published' as const, tags: [], createdAt: '', updatedAt: '', slug: 's' };

test('화풍을 주면 Style 줄만 바뀌고 제목, 요약, 요구사항은 그대로 남는다', () => {
  const style = THUMBNAIL_PRESETS[1].style;
  const prompt = buildPrompt(metadata, 'tech', style);
  assert.match(prompt, new RegExp(`^Style: ${style}$`, 'm'));
  for (const kept of ['제목입니다', '요약입니다', 'Tech, React', 'no letters, words']) assert.ok(prompt.includes(kept), kept);
  assert.ok(!prompt.includes('"제목입니다"')); // 따옴표로 감싼 제목은 이미지 모델이 그려야 할 글자로 읽는다
  assert.ok(!prompt.includes(DEFAULT_THUMBNAIL_STYLE));
});

test('화풍을 주지 않으면 첫 프리셋이 기본값이다', () => {
  assert.match(buildPrompt(metadata, 'tech'), new RegExp(`^Style: ${THUMBNAIL_PRESETS[0].style}$`, 'm'));
  assert.equal(new Set(THUMBNAIL_PRESETS.map((p) => p.id)).size, THUMBNAIL_PRESETS.length); // id 중복 없음
});
