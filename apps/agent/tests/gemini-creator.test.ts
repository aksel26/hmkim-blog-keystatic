/**
 * creator가 모델 응답에서 본문만 남기는지 검사. LLM 호출은 require.cache로 대체한다.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const stub = (rel: string, exports: Record<string, unknown>) => {
  const id = require.resolve(rel);
  require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
};

const responses: string[] = [];
const prompts: string[] = [];
stub('../ai-agents/config/models', {
  gemini: {
    invoke: async (prompt: string) => {
      prompts.push(prompt);
      return { content: responses.shift() };
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { geminiCreator } = require('../ai-agents/agents/gemini-creator');

const metadataJson = '{"title":"t","summary":"s","keywords":["Tech"],"tags":[],"slug":"my-slug"}';
const state = { topic: 'topic', draftContent: 'draft', category: 'tech' };

test('태그 밖 머리말과 수정 사항 리포트는 본문에서 빠진다', async () => {
  responses.push(
    '수정 및 개선된 기술 블로그 포스트 초안입니다.\n\n---\n\n<blog_post>\n# 제목\n\n본문\n</blog_post>\n\n---\n\n### 📝 주요 수정 및 개선 사항 리포트:\n1. SEO 키워드 보완',
    metadataJson
  );
  const result = await geminiCreator(state);
  assert.equal(result.finalContent, '# 제목\n\n본문');
  assert.match(prompts[0], /<blog_post>/);
});

test('태그가 없으면 응답 전체를 본문으로 쓴다', async () => {
  responses.push('# 제목\n\n본문', metadataJson);
  const result = await geminiCreator(state);
  assert.equal(result.finalContent, '# 제목\n\n본문');
});
