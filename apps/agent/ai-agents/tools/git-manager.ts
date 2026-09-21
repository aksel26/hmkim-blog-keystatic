/**
 * Git Manager Tool
 * GitHub API를 통한 PR 생성 관리
 */

import { Octokit } from '@octokit/rest';
import { BlogPostState, OnProgressCallback } from '../types/workflow';

/**
 * GitHub API를 통한 PR 생성 결과
 */
export interface PRResult {
  prNumber?: number;
  prUrl?: string;
  branchName: string;
  content?: string;
}

/**
 * GitHub 클라이언트 초기화
 */
function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN 환경 변수가 설정되지 않았습니다.');
  }
  return new Octokit({ auth: token });
}

/**
 * GitHub 설정 가져오기
 */
function getGitHubConfig() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const baseBranch = process.env.GITHUB_BASE_BRANCH || 'main';

  if (!owner || !repo) {
    throw new Error('GITHUB_OWNER 또는 GITHUB_REPO 환경 변수가 설정되지 않았습니다.');
  }

  return { owner, repo, baseBranch };
}

/**
 * 현재 날짜를 YYYYMMDD 형식으로 반환 (브랜치명용)
 */
function getDateForBranch(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Deploy 단계 - GitHub API를 통해 브랜치 생성 및 PR 생성
 */
export async function gitCommitAndPush(
  state: BlogPostState,
  onProgress?: OnProgressCallback
): Promise<Partial<BlogPostState> & { prResult?: PRResult }> {
  try {
    onProgress?.({
      step: 'deploy',
      status: 'started',
      message: '배포 준비 중...',
    });

    if (!state.metadata?.title) {
      throw new Error('메타데이터의 제목이 없습니다.');
    }

    if (!state.finalContent) {
      throw new Error('최종 콘텐츠가 없습니다.');
    }

    // GitHub 설정 확인
    const { owner, repo, baseBranch } = getGitHubConfig();
    const octokit = getOctokit();

    // 브랜치명 생성
    const slug = state.metadata.slug || 'new-post';
    const dateStr = getDateForBranch();
    let branchName = `post/${dateStr}-${slug}`;

    onProgress?.({
      step: 'deploy',
      status: 'progress',
      message: `브랜치 생성 중: ${branchName}`,
      data: { branchName },
    });

    // Frontmatter 생성
    const { title, summary, keywords, status, tags, createdAt, updatedAt, thumbnailImage } = state.metadata;
    const keywordsYaml = keywords.map(k => `  - ${k}`).join('\n');
    const tagsYaml = tags.map(t => `  - ${t}`).join('\n');
    const thumbnailLine = thumbnailImage ? `thumbnailImage: ${thumbnailImage}\n` : '';

    const frontmatter = `---
title: ${title}
summary: ${summary}
keywords:
${keywordsYaml}
status: ${status}
tags:
${tagsYaml}
createdAt: ${createdAt}
updatedAt: ${updatedAt}
${thumbnailLine}---

`;

    // 전체 콘텐츠 (Frontmatter + 본문)
    const fullContent = frontmatter + state.finalContent;

    // 카테고리에 따른 파일 경로
    const category = state.category || 'tech';
    const filePath = `apps/blog/content/${category}/${slug}.mdoc`;

    // 1. base branch의 최신 커밋 SHA 가져오기
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = refData.object.sha;

    // 2. 새 브랜치 생성
    try {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });
    } catch (error: unknown) {
      // 브랜치가 이미 존재하는 경우 타임스탬프 추가
      if (error instanceof Error && error.message.includes('Reference already exists')) {
        // 이후 커밋과 PR이 새 브랜치를 쓰도록 branchName 자체를 바꾼다.
        // 지역 변수에만 담아 두면 파일이 기존 브랜치(다른 PR)로 커밋된다
        branchName = `${branchName}-${Date.now()}`;
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        });
        onProgress?.({
          step: 'deploy',
          status: 'progress',
          message: `브랜치 이름 변경: ${branchName}`,
        });
      } else {
        throw error;
      }
    }

    onProgress?.({
      step: 'deploy',
      status: 'progress',
      message: '파일 커밋 중...',
    });

    // 같은 slug의 글이 base에 이미 병합돼 있으면 파일이 존재한다. 이때 sha 없이 쓰면 GitHub가
    // '"sha" wasn't supplied'로 거절하므로 기존 sha를 찾아 수정 커밋으로 올린다 (PR diff에 변경으로 보인다)
    const existingSha = async (path: string): Promise<string | undefined> => {
      try {
        const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branchName });
        return Array.isArray(data) ? undefined : data.sha;
      } catch (error: unknown) {
        if ((error as { status?: number }).status === 404) return undefined;
        throw error;
      }
    };

    // 3-1. 썸네일 이미지 업로드 (있는 경우)
    if (state.thumbnailImage?.buffer && state.thumbnailImage.path) {
      const thumbnailPath = `apps/blog/public${state.thumbnailImage.path}`;
      try {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: thumbnailPath,
          message: `feat(content): Add thumbnail for ${title}`,
          content: state.thumbnailImage.buffer,
          branch: branchName,
          sha: await existingSha(thumbnailPath),
        });
        onProgress?.({
          step: 'deploy',
          status: 'progress',
          message: '썸네일 이미지 업로드 완료',
        });
      } catch (imgError) {
        console.error('[Deploy] 썸네일 이미지 업로드 실패:', imgError);
        onProgress?.({
          step: 'deploy',
          status: 'progress',
          message: '썸네일 이미지 업로드 실패 (계속 진행)',
        });
      }
    }

    // 3-2. 파일 생성/업데이트
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `feat(content): Add new post - ${title}`,
      content: Buffer.from(fullContent).toString('base64'),
      branch: branchName,
      sha: await existingSha(filePath),
    });

    onProgress?.({
      step: 'deploy',
      status: 'progress',
      message: 'PR 생성 중...',
    });

    // 4. PR 생성
    const { data: prData } = await octokit.pulls.create({
      owner,
      repo,
      title: `[Content] ${title}`,
      head: branchName,
      base: baseBranch,
      body: `## 새 콘텐츠 추가

**제목**: ${title}

**요약**: ${summary}

**카테고리**: ${category}

**태그**: ${tags.join(', ')}

**키워드**: ${keywords.join(', ')}

---

*이 PR은 AI Agent에 의해 자동 생성되었습니다.*
`,
    });

    const prResult: PRResult = {
      prNumber: prData.number,
      prUrl: prData.html_url,
      branchName,
      content: fullContent,
    };

    onProgress?.({
      step: 'deploy',
      status: 'completed',
      message: `PR 생성 완료! #${prData.number}`,
      data: {
        prNumber: prData.number,
        prUrl: prData.html_url,
        branchName,
        slug,
        title,
      },
    });

    return {
      currentStep: 'deploy_completed',
      progress: 100,
      prResult,
    };
  } catch (error) {
    onProgress?.({
      step: 'deploy',
      status: 'error',
      message: `배포 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      data: { error },
    });

    throw error;
  }
}

/**
 * 콘텐츠 업데이트 (피드백 반영)
 */
export async function updateFromPRFeedback(
  content: string,
  feedbackSummary: string,
  onProgress?: OnProgressCallback
): Promise<{ content: string }> {
  onProgress?.({
    step: 'update',
    status: 'started',
    message: '피드백 반영 중...',
  });

  onProgress?.({
    step: 'update',
    status: 'completed',
    message: `피드백 반영 완료: ${feedbackSummary}`,
    data: { feedbackSummary },
  });

  return { content };
}
