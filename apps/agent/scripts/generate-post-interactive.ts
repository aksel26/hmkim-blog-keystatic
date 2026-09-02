#!/usr/bin/env node

/**
 * Interactive CLI for Blog Post Generation
 * AI 멀티에이전트 시스템을 사용한 블로그 포스트 자동 생성
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import dotenv from 'dotenv';
import { runBlogWorkflow, HumanReviewCallback, MAX_REJECTIONS } from '../ai-agents/workflows/blog-workflow';
import { BlogPostState, StreamEvent } from '../ai-agents/types/workflow';

// 환경 변수 로드 (루트 디렉토리의 .env.local)
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });

/**
 * 스피너 관리
 */
let currentSpinner: Ora | null = null;

/**
 * 진행 상황 이벤트 핸들러
 */
function handleProgress(event: StreamEvent) {
  const { step, status, message, data } = event;

  switch (status) {
    case 'started':
      if (currentSpinner) {
        currentSpinner.stop();
      }
      currentSpinner = ora(chalk.blue(message)).start();
      break;

    case 'progress':
      if (currentSpinner) {
        currentSpinner.text = chalk.blue(message);
      }
      break;

    case 'completed':
      if (currentSpinner) {
        currentSpinner.succeed(chalk.green(message));
        currentSpinner = null;
      }
      break;

    case 'error':
      if (currentSpinner) {
        currentSpinner.fail(chalk.red(message));
        currentSpinner = null;
      }
      console.error(chalk.red(`Error in ${step}:`), data?.error);
      break;
  }
}

/**
 * 사람 검토 핸들러
 */
const handleHumanReview: HumanReviewCallback = async (state: BlogPostState) => {
  if (currentSpinner) {
    currentSpinner.stop();
    currentSpinner = null;
  }

  console.log('\n' + chalk.yellow('='.repeat(60)));
  console.log(chalk.yellow.bold('  검토 (배포될 최종본)'));
  console.log(chalk.yellow('='.repeat(60)) + '\n');

  // 배포 대상은 finalContent이므로 그것을 보여준다 (처음 500자)
  const content = state.finalContent ?? state.draftContent ?? '';
  console.log(chalk.gray(content.substring(0, 500)));
  if (content.length > 500) {
    console.log(chalk.gray('...(계속)'));
  }
  if (state.validationResult && !state.validationResult.passed) {
    console.log('\n' + chalk.red('검증 실패:'));
    state.validationResult.errors.forEach((e) => console.log(chalk.red(`  - ${e}`)));
  }

  console.log('\n' + chalk.yellow('='.repeat(60)) + '\n');

  // 3가지 선택지
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '초안을 어떻게 처리하시겠습니까?',
      choices: [
        { name: chalk.green('✓ 승인 (다음 단계로 진행)'), value: 'approve' },
        { name: chalk.yellow('✎ 수정 요청 (피드백 반영해 Create부터 재실행)'), value: 'feedback' },
        { name: chalk.red('↻ 다시 작성 (Write부터 재실행)'), value: 'rewrite' },
      ],
    },
  ]);

  if (action === 'approve') {
    return { approved: true };
  } else if (action === 'feedback') {
    const { feedback } = await inquirer.prompt([
      {
        type: 'input',
        name: 'feedback',
        message: '수정 요청 사항을 입력해주세요:',
        validate: (input) => (input.trim().length > 0 ? true : '피드백을 입력해주세요.'),
      },
    ]);

    return { approved: false, feedback, rerunFrom: 'create' };
  } else {
    return { approved: false, rerunFrom: 'write' };
  }
};

/**
 * 메인 함수
 */
async function main() {
  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan.bold('  AI 멀티에이전트 블로그 포스트 생성기'));
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  try {
    // 1. 주제 입력받기
    const { topic } = await inquirer.prompt([
      {
        type: 'input',
        name: 'topic',
        message: chalk.white('블로그 포스트 주제를 입력해주세요:'),
        validate: (input) => (input.trim().length > 0 ? true : '주제를 입력해주세요.'),
      },
    ]);

    console.log('\n' + chalk.cyan('워크플로우를 시작합니다...\n'));

    // 2. 워크플로우 실행
    const finalState = await runBlogWorkflow(topic, handleProgress, handleHumanReview);

    // 3. 최종 결과 출력
    console.log('\n' + chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green.bold('  생성 완료!'));
    console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    if (finalState.metadata) {
      console.log(chalk.white.bold('제목: ') + chalk.cyan(finalState.metadata.title));
      console.log(chalk.white.bold('요약: ') + chalk.gray(finalState.metadata.summary));
      console.log(
        chalk.white.bold('태그: ') +
          finalState.metadata.tags.map((tag) => chalk.magenta(`#${tag}`)).join(' ')
      );
      if (finalState.prResult?.prUrl) {
        console.log(chalk.white.bold('PR: ') + chalk.blue(finalState.prResult.prUrl));
      }
    }

    if (finalState.filepath) {
      console.log(chalk.white.bold('파일: ') + chalk.blue(finalState.filepath));
    }

    if (finalState.commitHash) {
      console.log(chalk.white.bold('커밋: ') + chalk.yellow(finalState.commitHash.substring(0, 7)));
    }

    if (finalState.validationResult && !finalState.validationResult.passed) {
      console.log('\n' + chalk.red.bold('검증 경고:'));
      finalState.validationResult.errors.forEach((error) => {
        console.log(chalk.red(`  - ${error}`));
      });
    }

    if (finalState.humanApproval === false) {
      console.log('\n' + chalk.red(`반려 ${MAX_REJECTIONS}회를 넘겨 배포 없이 종료했습니다.\n`));
    } else {
      console.log('\n' + chalk.green('블로그 포스트가 성공적으로 생성되었습니다! 🎉\n'));
    }
  } catch (error) {
    if (currentSpinner) {
      currentSpinner.fail(chalk.red('오류 발생'));
    }

    console.error('\n' + chalk.red.bold('오류 발생:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));

    if (error instanceof Error && error.stack) {
      console.error(chalk.gray('\n스택 트레이스:'));
      console.error(chalk.gray(error.stack));
    }

    process.exit(1);
  }
}

// 실행
main();
