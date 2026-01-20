/**
 * File Manager Tool
 * MDX 파일 생성 및 관리
 */

import * as fs from 'fs';
import * as path from 'path';
import { BlogPostState, OnProgressCallback } from '../types/workflow';

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * MDX 파일 생성
 */
export async function createMdxFile(
  state: BlogPostState,
  onProgress?: OnProgressCallback
): Promise<Partial<BlogPostState>> {
  try {
    onProgress?.({
      step: 'createFile',
      status: 'started',
      message: 'MDX 파일 생성 중...',
    });

    if (!state.metadata) {
      throw new Error('메타데이터가 없습니다.');
    }

    if (!state.finalContent) {
      throw new Error('최종 콘텐츠가 없습니다.');
    }

    const { title, summary, keywords, status, tags, createdAt, updatedAt, slug } = state.metadata;

    // content/{category} 디렉토리 경로 (apps/blog/content/tech 또는 apps/blog/content/life)
    const blogContentPath = process.env.BLOG_CONTENT_PATH || path.join(process.cwd(), '..', 'blog', 'content');
    const category = state.category || 'tech';
    const postsDir = path.join(blogContentPath, category);

    // 디렉토리가 없으면 생성
    if (!fs.existsSync(postsDir)) {
      onProgress?.({
        step: 'createFile',
        status: 'progress',
        message: 'content/posts 디렉토리 생성 중...',
      });
      fs.mkdirSync(postsDir, { recursive: true });
    }

    // 파일명: slug.mdoc (Keystatic 형식)
    const filename = `${slug}.mdoc`;
    const filepath = path.join(postsDir, filename);

    onProgress?.({
      step: 'createFile',
      status: 'progress',
      message: `파일 작성 중: ${filename}`,
    });

    // Keystatic 형식 Frontmatter
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

    // 전체 MDX 콘텐츠
    const mdxContent = frontmatter + state.finalContent;

    // 파일 쓰기
    fs.writeFileSync(filepath, mdxContent, 'utf-8');

    onProgress?.({
      step: 'createFile',
      status: 'completed',
      message: `파일이 생성되었습니다: ${filepath}`,
      data: { filepath, filename },
    });

    return {
      filepath,
      currentStep: 'file_created',
      progress: 70,
    };
  } catch (error) {
    onProgress?.({
      step: 'createFile',
      status: 'error',
      message: `파일 생성 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      data: { error },
    });

    throw error;
  }
}
