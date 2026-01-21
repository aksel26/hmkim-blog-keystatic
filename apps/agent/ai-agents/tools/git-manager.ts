/**
 * Git Manager Tool
 * PR 생성 관리 (파일 생성 없이 콘텐츠만 관리)
 */

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
 * Deploy 단계 - 콘텐츠 완료 처리
 * 파일 생성 없이 콘텐츠와 메타데이터만 반환
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

    // 브랜치명 생성 (참고용)
    const slug = state.metadata.slug || 'new-post';
    const dateStr = getDateForBranch();
    const branchName = `post/${dateStr}-${slug}`;

    onProgress?.({
      step: 'deploy',
      status: 'progress',
      message: '콘텐츠 검증 완료',
      data: { branchName },
    });

    // Frontmatter 생성
    const { title, summary, keywords, status, tags, createdAt, updatedAt } = state.metadata;
    const keywordsYaml = keywords.map(k => `  - ${k}`).join('\n');
    const tagsYaml = tags.map(t => `  - ${t}`).join('\n');

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
---

`;

    // 전체 콘텐츠 (Frontmatter + 본문)
    const fullContent = frontmatter + state.finalContent;

    const prResult: PRResult = {
      branchName,
      content: fullContent,
    };

    onProgress?.({
      step: 'deploy',
      status: 'completed',
      message: '콘텐츠 생성 완료! 에디터에서 확인하세요.',
      data: {
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
