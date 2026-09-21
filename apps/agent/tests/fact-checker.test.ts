/**
 * fact-checker가 모델 응답을 걸러 담고, 실패해도 워크플로우를 멈추지 않는지 검사. LLM 호출은 require.cache로 대체한다.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const stub = (rel: string, exports: Record<string, unknown>) => {
  const id = require.resolve(rel);
  require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
};

let response: string | Error = '';
const prompts: string[] = [];
stub('../ai-agents/config/models', {
  gemini: {
    invoke: async (prompt: string) => {
      prompts.push(prompt);
      if (response instanceof Error) throw response;
      return { content: response };
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { factChecker } = require('../ai-agents/agents/fact-checker');

const state = {
  topic: 't',
  category: 'tech',
  finalContent: '# 제목\n\ncancelRefetch의 기본값은 false입니다.',
  researchData: { sources: [{ title: '공식 문서', url: 'https://example.com', snippet: 'cancelRefetch defaults to true' }], summary: 's', keyPoints: [] },
};

test('형식이 맞는 지적만 남기고, 모르는 verdict·severity는 기본값으로 바꾼다', async () => {
  response = '```json\n' + JSON.stringify({
    summary: '기본값 설명이 자료와 다릅니다',
    issues: [
      { claim: 'cancelRefetch의 기본값은 false입니다.', verdict: 'contradicted', severity: 'high', problem: '자료는 true라고 한다', suggestion: 'true로 고친다', source: 1 },
      { claim: '모호한 주장', verdict: '이상한값', severity: '???', problem: '근거 없음' },
      '문자열 항목',
      { verdict: 'code' },
    ],
  }) + '\n```';
  const events: Array<{ status: string }> = [];
  const { factCheckResult } = await factChecker(state, (e: { status: string }) => events.push(e));
  assert.equal(factCheckResult.issues.length, 2);
  assert.deepEqual(factCheckResult.issues[0], { claim: 'cancelRefetch의 기본값은 false입니다.', verdict: 'contradicted', severity: 'high', problem: '자료는 true라고 한다', suggestion: 'true로 고친다', source: 1 });
  assert.deepEqual(factCheckResult.issues[1], { claim: '모호한 주장', verdict: 'unsupported', severity: 'medium', problem: '근거 없음', suggestion: '' });
  assert.match(prompts[0], /\[1\] 공식 문서 \(https:\/\/example\.com\)/); // 자료가 번호와 함께 프롬프트에 들어간다
  assert.ok(!events.some((e) => e.status === 'error'));
});

test('모델 호출이나 파싱이 실패해도 던지지 않고 결과를 비운다', async () => {
  for (const bad of [new Error('429'), 'JSON이 아닌 응답']) {
    response = bad;
    const events: Array<{ status: string }> = [];
    const result = await factChecker(state, (e: { status: string }) => events.push(e));
    assert.equal(result.factCheckResult, undefined);
    assert.ok('factCheckResult' in result); // 이전 라운드 결과를 덮어 지운다
    assert.ok(!events.some((e) => e.status === 'error')); // error 이벤트는 진행 화면에서 단계를 실패로 칠한다
  }
});
