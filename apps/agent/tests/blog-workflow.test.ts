/**
 * 그래프 분기 검사: 반려 1회 → write부터 재실행 → 승인 → skipDeploy면 deploy 미실행.
 * LLM/Git 호출은 require.cache로 대체한다 (tsx는 CommonJS 모드로 .ts를 require 가능).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const stub = (rel: string, exports: Record<string, unknown>) => {
  const id = require.resolve(rel);
  require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
};

const calls: string[] = [];
const agent = (name: string, patch: Record<string, unknown>) => async () => {
  calls.push(name);
  return patch;
};

stub('../ai-agents/agents/gemini-researcher', { geminiResearcher: agent('research', { researchData: { sources: [], summary: 's', keyPoints: [] } }) });
stub('../ai-agents/agents/gemini-writer', { geminiWriter: agent('write', { draftContent: 'draft' }) });
stub('../ai-agents/agents/reviewer', { reviewer: agent('review', { reviewResult: { seoScore: 1 } }) });
stub('../ai-agents/agents/gemini-creator', {
  geminiCreator: agent('create', { finalContent: 'final', metadata: { title: 't', slug: 's', tags: [] } }),
});
stub('../ai-agents/tools/thumbnail-generator', { generateThumbnail: agent('thumbnail', null as never) });
stub('../ai-agents/agents/validator', { validator: agent('validate', { validationResult: { passed: true, errors: [] } }) });
stub('../ai-agents/tools/git-manager', { gitCommitAndPush: agent('deploy', { commitHash: 'abc' }) });

const { runBlogWorkflow } = require('../ai-agents/workflows/blog-workflow');

test('반려 시 write부터 재실행하고, 승인 후 skipDeploy면 deploy를 건너뛴다', async () => {
  const steps: string[] = [];
  let reviews = 0;
  const state = await runBlogWorkflow(
    'topic',
    (e: { step: string }) => { steps.push(e.step); },
    async () => (++reviews === 1 ? { approved: false, feedback: '더 짧게' } : { approved: true }),
    'tech',
    true
  );

  assert.deepEqual(calls, [
    'research',
    'write', 'review', 'create', 'thumbnail', 'validate',
    'write', 'review', 'create', 'thumbnail', 'validate',
  ]);
  assert.equal(reviews, 2);
  assert.equal(state.humanApproval, true);
  assert.equal(state.humanFeedback, undefined);
  assert.equal(state.commitHash, undefined);
  assert.equal(steps.at(-1), 'completed');
});

test('승인 + skipDeploy=false면 deploy가 실행된다', async () => {
  calls.length = 0;
  const state = await runBlogWorkflow('topic', undefined, async () => ({ approved: true }), 'tech', false);
  assert.equal(calls.at(-1), 'deploy');
  assert.equal(state.commitHash, 'abc');
});
