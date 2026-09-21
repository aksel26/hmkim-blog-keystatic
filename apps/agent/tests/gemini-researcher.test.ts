/**
 * 검색 결과 관련도 필터 검사. 모델 설정은 require.cache로 대체한다 (import만으로 API 키를 요구하지 않게).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const id = require.resolve('../ai-agents/config/models');
require.cache[id] = { id, filename: id, loaded: true, exports: { gemini: {} } } as NodeModule;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dropIrrelevant } = require('../ai-agents/agents/gemini-researcher');

const r = (score: number) => ({ score });
const scores = (results: Array<{ score: number }>) => results.map((x) => x.score);

test('관련도가 낮은 검색 결과를 버린다', () => {
  // 실제로 관측한 분포: 관련 글 0.25~0.63, 무관한 뉴스 0.01~0.02
  assert.deepEqual(scores(dropIrrelevant([r(0.019), r(0.625), r(0.446), r(0.01), r(0.248), r(0.49)])), [0.625, 0.49, 0.446, 0.248]);
});

test('기준을 넘는 결과가 3개 미만이면 상위 3개를 남긴다', () => {
  assert.deepEqual(scores(dropIrrelevant([r(0.05), r(0.3), r(0.01), r(0.1)])), [0.3, 0.1, 0.05]);
  assert.deepEqual(dropIrrelevant([]), []);
});
