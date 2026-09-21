/**
 * 그래프 분기 검사. LLM/Git 호출은 require.cache로 대체한다 (tsx는 CommonJS 모드로 .ts를 require 가능).
 */
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

const stub = (rel: string, exports: Record<string, unknown>) => {
  const id = require.resolve(rel);
  require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
};

const calls: string[] = [];
const inputs: Record<string, unknown[]> = {};
const agent = (name: string, patch: unknown) => async (state: unknown) => {
  calls.push(name);
  (inputs[name] ??= []).push(state);
  return typeof patch === 'function' ? patch() : patch;
};
let title = 't';
let passed = true;
const thumb = { buffer: '', mimeType: 'image/png', path: '/images/thumbnails/my-slug/thumbnailImage.png' };

stub('../ai-agents/agents/gemini-researcher', { geminiResearcher: agent('research', { researchData: { sources: [], summary: 's', keyPoints: [] } }) });
stub('../ai-agents/agents/gemini-writer', { geminiWriter: agent('write', { draftContent: 'draft' }) });
stub('../ai-agents/agents/reviewer', { reviewer: agent('review', { reviewResult: { seoScore: 1 } }) });
stub('../ai-agents/agents/gemini-creator', {
  geminiCreator: agent('create', () => ({ finalContent: 'final', metadata: { title, slug: 'my-slug', tags: [] } })),
});
stub('../ai-agents/agents/fact-checker', { factChecker: agent('factCheck', { factCheckResult: { summary: '', issues: [] } }) });
stub('../ai-agents/tools/thumbnail-generator', { generateThumbnail: agent('thumbnail', thumb) });
stub('../ai-agents/agents/validator', { validator: agent('validate', () => ({ validationResult: { passed, errors: passed ? [] : ['bad'] } })) });
stub('../ai-agents/tools/git-manager', { gitCommitAndPush: agent('deploy', { prResult: { prUrl: 'https://example/pr/1' } }) });

const { runBlogWorkflow, MAX_REJECTIONS } = require('../ai-agents/workflows/blog-workflow');

const FIRST_PASS = ['research', 'write', 'review', 'create', 'factCheck', 'thumbnail', 'validate'];
const run = (review: (n: number) => unknown, skipDeploy = true) => {
  let n = 0;
  return runBlogWorkflow('topic', undefined, async () => review(++n), 'tech', skipDeploy);
};

beforeEach(() => { calls.length = 0; title = 't'; passed = true; for (const k in inputs) delete inputs[k]; });

test('반려(기본)는 검토본을 초안 삼아 create부터 재실행하고, 제목이 같으면 썸네일을 재생성하지 않는다', async () => {
  const state = await run((n) => (n === 1 ? { approved: false, feedback: '더 짧게' } : { approved: true }));
  assert.deepEqual(calls, [...FIRST_PASS, 'create', 'factCheck', 'validate']);
  assert.equal((inputs.create[1] as { draftContent: string }).draftContent, 'final');
  assert.equal(state.humanApproval, true);
  assert.equal(state.metadata.thumbnailImage, thumb.path);
  assert.equal(state.prResult, undefined); // skipDeploy
});

test('제목이 바뀌면 썸네일을 다시 만든다', async () => {
  await run((n) => {
    title = `t${n}`;
    return n === 1 ? { approved: false } : { approved: true };
  });
  assert.deepEqual(calls, [...FIRST_PASS, 'create', 'factCheck', 'thumbnail', 'validate']);
});

test("rerunFrom='write'면 초안부터 다시 쓴다", async () => {
  await run((n) => (n === 1 ? { approved: false, rerunFrom: 'write' } : { approved: true }));
  assert.deepEqual(calls, [...FIRST_PASS, 'write', 'review', 'create', 'factCheck', 'validate']);
});

test('반려가 MAX_REJECTIONS를 넘으면 배포 없이 종료한다', async () => {
  const state = await run(() => ({ approved: false }), false);
  assert.equal(calls.filter((c) => c === 'create').length, 1 + MAX_REJECTIONS);
  assert.equal(state.humanApproval, false);
  assert.equal(state.rejections, MAX_REJECTIONS + 1);
  assert.ok(!calls.includes('deploy'));
});

test('승인 + skipDeploy=false면 deploy가 실행된다', async () => {
  const state = await run(() => ({ approved: true }), false);
  assert.equal(calls.at(-1), 'deploy');
  assert.equal(state.prResult.prUrl, 'https://example/pr/1');
});

test('승인했어도 검증 실패면 deploy를 건너뛴다', async () => {
  passed = false;
  const state = await run(() => ({ approved: true }), false);
  assert.equal(state.humanApproval, true);
  assert.ok(!calls.includes('deploy'));
  assert.equal(state.prResult, undefined);
});

// 서버 재시작 뒤 agent-web이 DB 상태로 이어 돌리는 경로 (resume 인자)
const resumeRun = (resume: Record<string, unknown>, review: () => unknown = () => ({ approved: true })) =>
  runBlogWorkflow('topic', undefined, async () => review(), 'tech', true, { tone: 'friendly', targetReader: '입문자' }, resume);

test("resume.rerunFrom='create'면 검토본과 피드백을 들고 create부터 들어간다", async () => {
  await resumeRun({ rerunFrom: 'create', draftContent: '검토본', humanFeedback: '더 짧게', thumbnailImage: thumb, thumbnailFor: 't' });
  assert.deepEqual(calls, ['create', 'factCheck', 'validate']); // 제목이 같아 썸네일 재사용
  assert.deepEqual(
    { draft: (inputs.create[0] as { draftContent: string }).draftContent, fb: (inputs.create[0] as { humanFeedback: string }).humanFeedback },
    { draft: '검토본', fb: '더 짧게' }
  );
  // 재개해도 작성 옵션이 에이전트까지 전달된다
  const { tone, targetReader } = inputs.create[0] as { tone: string; targetReader: string };
  assert.deepEqual({ tone, targetReader }, { tone: 'friendly', targetReader: '입문자' });
});

test('재개 전 반려 횟수를 이어 세어 상한을 넘으면 배포 없이 종료한다', async () => {
  const state = await resumeRun({ rerunFrom: 'create', draftContent: '검토본', rejections: MAX_REJECTIONS }, () => ({ approved: false }));
  assert.equal(calls.filter((c) => c === 'create').length, 1); // 재개분 한 번 돌고, 다음 반려에서 끝
  assert.equal(state.rejections, MAX_REJECTIONS + 1);
  assert.equal(state.humanApproval, false);
});

test("resume.rerunFrom='write'면 write부터, rerunFrom이 없으면 research부터 돈다", async () => {
  await resumeRun({ rerunFrom: 'write', humanFeedback: 'f' });
  assert.deepEqual(calls, FIRST_PASS.slice(1));
  calls.length = 0;
  await resumeRun({ humanFeedback: 'f' });
  assert.deepEqual(calls, FIRST_PASS);
  assert.equal((inputs.write[1] as { humanFeedback: string }).humanFeedback, 'f');
});
