/**
 * deploy가 올바른 브랜치에 커밋하는지 검사. GitHub API는 require.cache로 대체한다.
 */
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

const stub = (rel: string, exports: Record<string, unknown>) => {
  const id = require.resolve(rel);
  require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
};

let existingBranches: string[] = [];
let existingFiles: Record<string, string> = {}; // path → sha (모든 브랜치 공통)
const refs: string[] = [];
const commits: Array<{ path: string; branch: string; sha?: string }> = [];
let prHead = '';

stub('@octokit/rest', {
  Octokit: class {
    git = {
      getRef: async () => ({ data: { object: { sha: 'base-sha' } } }),
      createRef: async ({ ref }: { ref: string }) => {
        const name = ref.replace('refs/heads/', '');
        if (existingBranches.includes(name)) throw new Error('Reference already exists');
        refs.push(name);
      },
    };
    repos = {
      getContent: async ({ path }: { path: string }) => {
        if (!(path in existingFiles)) throw Object.assign(new Error('Not Found'), { status: 404 });
        return { data: { sha: existingFiles[path] } };
      },
      createOrUpdateFileContents: async (args: { path: string; branch: string; sha?: string }) => {
        if (args.path in existingFiles && !args.sha) throw new Error('Invalid request.\n\n"sha" wasn\'t supplied.');
        commits.push({ path: args.path, branch: args.branch, sha: args.sha });
      },
    };
    pulls = {
      create: async ({ head }: { head: string }) => {
        prHead = head;
        return { data: { number: 1, html_url: 'https://example/pr/1' } };
      },
    };
  },
});

Object.assign(process.env, { GITHUB_TOKEN: 't', GITHUB_OWNER: 'o', GITHUB_REPO: 'r' });
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { gitCommitAndPush } = require('../ai-agents/tools/git-manager');

const state = {
  topic: 't', currentStep: 'deploy', progress: 95, category: 'tech', finalContent: '# 본문',
  metadata: { title: '제목', summary: '요약', keywords: ['Tech'], status: 'published', tags: ['a'], createdAt: '2026-09-21', updatedAt: '2026-09-21', slug: 'my-slug', thumbnailImage: '/images/thumbnails/my-slug/thumbnailImage.png' },
  thumbnailImage: { buffer: 'AAAA', mimeType: 'image/png', path: '/images/thumbnails/my-slug/thumbnailImage.png' },
};
const POST = 'apps/blog/content/tech/my-slug.mdoc';
const THUMB = 'apps/blog/public/images/thumbnails/my-slug/thumbnailImage.png';

beforeEach(() => { existingBranches = []; existingFiles = {}; refs.length = 0; commits.length = 0; prHead = ''; });

test('같은 이름의 브랜치가 이미 있으면 새 브랜치를 만들고, 커밋과 PR도 그 브랜치로 보낸다', async () => {
  const first = await gitCommitAndPush(state);
  const original = first.prResult.branchName;
  existingBranches = [original]; // 열려 있는 다른 PR의 브랜치
  refs.length = 0; commits.length = 0;

  const { prResult } = await gitCommitAndPush(state);
  assert.notEqual(prResult.branchName, original);
  assert.match(prResult.branchName, new RegExp(`^${original}-\\d+$`));
  assert.deepEqual(refs, [prResult.branchName]);
  assert.deepEqual(commits.map((c) => c.branch), [prResult.branchName, prResult.branchName]); // 썸네일, 본문
  assert.equal(prHead, prResult.branchName);
});

test('같은 경로의 파일이 이미 있으면 sha를 붙여 수정 커밋으로 올린다', async () => {
  existingFiles = { [POST]: 'post-sha', [THUMB]: 'thumb-sha' };
  await gitCommitAndPush(state);
  assert.deepEqual(commits.map((c) => [c.path, c.sha]), [[THUMB, 'thumb-sha'], [POST, 'post-sha']]);
});

test('새 파일이면 sha 없이 만든다', async () => {
  await gitCommitAndPush(state);
  assert.deepEqual(commits.map((c) => c.sha), [undefined, undefined]);
});
