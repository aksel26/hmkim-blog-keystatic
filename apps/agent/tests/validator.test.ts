import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validator } from '../ai-agents/agents/validator';
import type { BlogPostState } from '../ai-agents/types/workflow';

const valid = (): BlogPostState => ({
  topic: 't',
  currentStep: 'validate',
  progress: 0,
  finalContent: '본문 '.repeat(200) + '\n```ts\nconst a = 1;\n```\n',
  metadata: {
    title: '제목',
    summary: '요약',
    keywords: ['k'],
    status: 'draft',
    tags: ['a', 'b', 'c'],
    createdAt: '2026-09-02',
    updatedAt: '2026-09-02',
    slug: 'slug',
  },
});

const errorsOf = async (mutate: (s: BlogPostState) => void) => {
  const s = valid();
  mutate(s);
  return (await validator(s)).validationResult!;
};

test('규칙을 모두 만족하면 통과', async () => {
  assert.deepEqual(await errorsOf(() => {}), { passed: true, errors: [] });
});

test('형식 규칙 위반을 각각 잡는다', async () => {
  const cases: Array<[string, (s: BlogPostState) => void, RegExp]> = [
    ['제목 60자 초과', (s) => { s.metadata!.title = 'x'.repeat(61); }, /제목이 너무 깁니다/],
    ['요약 150자 초과', (s) => { s.metadata!.summary = 'x'.repeat(151); }, /요약이 너무 깁니다/],
    ['태그 3개 미만', (s) => { s.metadata!.tags = ['a']; }, /태그는 최소 3개/],
    ['태그 5개 초과', (s) => { s.metadata!.tags = ['a', 'b', 'c', 'd', 'e', 'f']; }, /태그는 최대 5개/],
    ['날짜 형식', (s) => { s.metadata!.createdAt = '2026/09/02'; }, /createdAt/],
    ['본문 500자 미만', (s) => { s.finalContent = '짧다'; }, /콘텐츠가 너무 짧습니다/],
    ['코드블록 홀수', (s) => { s.finalContent += '```'; }, /코드 블록/],
    ['메타데이터 없음', (s) => { s.metadata = undefined; }, /메타데이터/],
  ];
  for (const [name, mutate, re] of cases) {
    const r = await errorsOf(mutate);
    assert.equal(r.passed, false, name);
    assert.ok(r.errors.some((e) => re.test(e)), `${name}: ${r.errors.join(' | ')}`);
  }
});
