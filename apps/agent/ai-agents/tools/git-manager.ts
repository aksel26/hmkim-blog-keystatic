/**
 * Git Manager Tool
 * Git 브랜치 생성, 커밋, PR 생성 관리
 */

import simpleGit, { SimpleGit } from 'simple-git';
import { BlogPostState, OnProgressCallback } from '../types/workflow';

/**
 * GitHub API를 통한 PR 생성 결과
 */
export interface PRResult {
  prNumber?: number;
  prUrl?: string;
  branchName: string;
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
 * GitHub CLI(gh)를 사용하여 PR 생성
 */
async function createPullRequest(
  git: SimpleGit,
  branchName: string,
  title: string,
  summary: string
): Promise<PRResult> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // PR 본문 생성
    const prBody = `## 새 블로그 포스트

### 제목
${title}

### 요약
${summary}

---
*이 PR은 AI Multi-Agent 시스템에 의해 자동 생성되었습니다.*
`;

    // gh CLI로 PR 생성
    const { stdout } = await execAsync(
      `gh pr create --title "기능: 새 포스트 추가 - ${title}" --body "${prBody.replace(/"/g, '\\"')}" --base main --head ${branchName}`
    );

    // PR URL 추출
    const prUrlMatch = stdout.match(/https:\/\/github\.com\/[^\s]+/);
    const prUrl = prUrlMatch ? prUrlMatch[0] : undefined;

    // PR 번호 추출
    const prNumberMatch = prUrl?.match(/\/pull\/(\d+)/);
    const prNumber = prNumberMatch ? parseInt(prNumberMatch[1], 10) : undefined;

    return {
      prNumber,
      prUrl,
      branchName,
    };
  } catch (error) {
    // gh CLI가 없거나 실패한 경우
    console.warn('PR 생성 실패 (gh CLI 필요):', error);
    return {
      branchName,
    };
  }
}

/**
 * Git 브랜치 생성, 커밋 및 PR 생성
 */
export async function gitCommitAndPush(
  state: BlogPostState,
  onProgress?: OnProgressCallback
): Promise<Partial<BlogPostState> & { prResult?: PRResult }> {
  try {
    onProgress?.({
      step: 'deploy',
      status: 'started',
      message: 'Git 배포 준비 중...',
    });

    if (!state.filepath) {
      throw new Error('파일 경로가 없습니다.');
    }

    if (!state.metadata?.title) {
      throw new Error('메타데이터의 제목이 없습니다.');
    }

    const git: SimpleGit = simpleGit();

    // Git 저장소 확인
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      onProgress?.({
        step: 'deploy',
        status: 'error',
        message: 'Git 저장소가 아닙니다. git init을 먼저 실행해주세요.',
      });

      return {
        currentStep: 'deploy_skipped',
        progress: 100,
      };
    }

    // 새 브랜치 생성
    const slug = state.metadata.slug || 'new-post';
    const dateStr = getDateForBranch();
    const branchName = `post/${dateStr}-${slug}`;

    onProgress?.({
      step: 'deploy',
      status: 'progress',
      message: `새 브랜치 생성 중: ${branchName}`,
    });

    // 현재 브랜치 저장
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);

    try {
      // main 브랜치로 이동 후 새 브랜치 생성
      await git.checkout('main');
      await git.pull('origin', 'main').catch(() => {
        // pull 실패는 무시 (원격이 없을 수 있음)
      });
      await git.checkoutLocalBranch(branchName);
    } catch {
      // main이 없으면 현재 브랜치에서 생성
      await git.checkoutLocalBranch(branchName);
    }

    onProgress?.({
      step: 'deploy',
      status: 'progress',
      message: '생성된 파일을 Git에 추가 중...',
    });

    // 생성된 파일 git add
    await git.add(state.filepath);

    onProgress?.({
      step: 'deploy',
      status: 'progress',
      message: '커밋 중...',
    });

    // 커밋 메시지 (한글)
    const commitMessage = `기능: 새 포스트 추가 - ${state.metadata.title}`;

    // 커밋
    const commitResult = await git.commit(commitMessage);
    const commitHash = commitResult.commit || 'unknown';

    onProgress?.({
      step: 'deploy',
      status: 'progress',
      message: `커밋 완료 (${commitHash.substring(0, 7)}). 브랜치 Push 중...`,
      data: { commitHash, branchName },
    });

    // Git push (새 브랜치)
    let prResult: PRResult = { branchName };

    try {
      await git.push('origin', branchName, ['--set-upstream']);

      onProgress?.({
        step: 'deploy',
        status: 'progress',
        message: 'Push 완료. PR 생성 중...',
      });

      // PR 생성 시도
      prResult = await createPullRequest(
        git,
        branchName,
        state.metadata.title,
        state.metadata.summary || ''
      );

      if (prResult.prUrl) {
        onProgress?.({
          step: 'deploy',
          status: 'completed',
          message: `PR이 생성되었습니다! ${prResult.prUrl}`,
          data: { commitHash, branchName, prResult },
        });
      } else {
        onProgress?.({
          step: 'deploy',
          status: 'completed',
          message: `브랜치 ${branchName}에 Push 완료. 수동으로 PR을 생성해주세요.`,
          data: { commitHash, branchName },
        });
      }
    } catch (pushError) {
      // Push 실패는 경고만 표시
      onProgress?.({
        step: 'deploy',
        status: 'completed',
        message: `커밋 완료 (${commitHash.substring(0, 7)}). Push 실패: ${pushError instanceof Error ? pushError.message : String(pushError)}`,
        data: { commitHash, branchName, pushError },
      });
    }

    return {
      commitHash,
      currentStep: 'deploy_completed',
      progress: 100,
      prResult,
    };
  } catch (error) {
    onProgress?.({
      step: 'deploy',
      status: 'error',
      message: `Git 배포 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      data: { error },
    });

    throw error;
  }
}

/**
 * PR 피드백을 받아 콘텐츠 수정 후 재커밋
 */
export async function updateFromPRFeedback(
  filepath: string,
  newContent: string,
  feedbackSummary: string,
  onProgress?: OnProgressCallback
): Promise<{ commitHash: string }> {
  const fs = await import('fs');
  const git: SimpleGit = simpleGit();

  onProgress?.({
    step: 'update',
    status: 'started',
    message: 'PR 피드백 반영 중...',
  });

  // 파일 업데이트
  fs.writeFileSync(filepath, newContent, 'utf-8');

  // Git add & commit
  await git.add(filepath);
  const commitMessage = `수정: PR 피드백 반영 - ${feedbackSummary}`;
  const commitResult = await git.commit(commitMessage);
  const commitHash = commitResult.commit || 'unknown';

  // Push
  await git.push();

  onProgress?.({
    step: 'update',
    status: 'completed',
    message: `피드백 반영 완료 (${commitHash.substring(0, 7)})`,
    data: { commitHash },
  });

  return { commitHash };
}
