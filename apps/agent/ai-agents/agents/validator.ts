/**
 * Validator Agent
 * 생성된 블로그 포스트 검증
 */

import * as fs from 'fs';
import { BlogPostState, OnProgressCallback, ValidationResult } from '../types/workflow';

/**
 * 검증 에이전트 - 파일 및 콘텐츠 검증
 */
export async function validator(
  state: BlogPostState,
  onProgress?: OnProgressCallback
): Promise<Partial<BlogPostState>> {
  try {
    onProgress?.({
      step: 'validate',
      status: 'started',
      message: '생성된 파일 검증 중...',
    });

    const errors: string[] = [];

    // 1. 파일 존재 여부 확인
    if (!state.filepath) {
      errors.push('파일 경로가 지정되지 않았습니다.');
    } else if (!fs.existsSync(state.filepath)) {
      errors.push(`파일이 존재하지 않습니다: ${state.filepath}`);
    }

    // 2. 메타데이터 유효성 검증 (새 형식)
    if (!state.metadata) {
      errors.push('메타데이터가 생성되지 않았습니다.');
    } else {
      const { title, summary, keywords, status, tags, createdAt, updatedAt } = state.metadata;

      if (!title || title.trim().length === 0) {
        errors.push('제목이 비어있습니다.');
      } else if (title.length > 60) {
        errors.push(`제목이 너무 깁니다 (${title.length}자). 60자 이내로 작성해주세요.`);
      }

      if (!summary || summary.trim().length === 0) {
        errors.push('요약(summary)이 비어있습니다.');
      } else if (summary.length > 150) {
        errors.push(`요약이 너무 깁니다 (${summary.length}자). 150자 이내로 작성해주세요.`);
      }

      if (!keywords || keywords.length === 0) {
        errors.push('키워드(keywords)가 비어있습니다.');
      }

      if (!status || !['draft', 'published'].includes(status)) {
        errors.push('상태(status)는 draft 또는 published여야 합니다.');
      }

      if (!tags || tags.length < 3) {
        errors.push('태그는 최소 3개 이상이어야 합니다.');
      } else if (tags.length > 5) {
        errors.push('태그는 최대 5개까지 가능합니다.');
      }

      if (!createdAt || !/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) {
        errors.push('생성일(createdAt)은 YYYY-MM-DD 형식이어야 합니다.');
      }

      if (!updatedAt || !/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) {
        errors.push('수정일(updatedAt)은 YYYY-MM-DD 형식이어야 합니다.');
      }
    }

    // 3. 콘텐츠 최소 길이 검증 (500자)
    if (!state.finalContent) {
      errors.push('최종 콘텐츠가 생성되지 않았습니다.');
    } else if (state.finalContent.trim().length < 500) {
      errors.push(
        `콘텐츠가 너무 짧습니다 (${state.finalContent.trim().length}자). 최소 500자 이상이어야 합니다.`
      );
    }

    // 4. 코드 블록 닫힘 확인 (``` 짝수)
    if (state.finalContent) {
      const codeBlockCount = (state.finalContent.match(/```/g) || []).length;
      if (codeBlockCount % 2 !== 0) {
        errors.push('코드 블록이 제대로 닫히지 않았습니다. ``` 개수를 확인해주세요.');
      }
    }

    onProgress?.({
      step: 'validate',
      status: 'progress',
      message: `검증 완료. ${errors.length > 0 ? `${errors.length}개 오류 발견` : '모든 검증 통과'}`,
    });

    const validationResult: ValidationResult = {
      passed: errors.length === 0,
      errors,
    };

    if (validationResult.passed) {
      onProgress?.({
        step: 'validate',
        status: 'completed',
        message: '모든 검증을 통과했습니다!',
        data: validationResult,
      });
    } else {
      onProgress?.({
        step: 'validate',
        status: 'error',
        message: `검증 실패: ${errors.join(', ')}`,
        data: validationResult,
      });
    }

    return {
      validationResult,
      currentStep: 'validate_completed',
      progress: 80,
    };
  } catch (error) {
    const validationResult: ValidationResult = {
      passed: false,
      errors: [`검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`],
    };

    onProgress?.({
      step: 'validate',
      status: 'error',
      message: `검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      data: { error, validationResult },
    });

    return {
      validationResult,
      currentStep: 'validate_error',
      progress: 80,
    };
  }
}
