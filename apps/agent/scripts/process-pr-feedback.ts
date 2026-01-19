/**
 * PR 피드백 처리 스크립트
 * GitHub Actions에서 실행되어 PR 댓글의 피드백을 처리합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import { geminiPro } from '../ai-agents/config/models';

interface FeedbackContext {
  prNumber: string;
  commentBody: string;
  commentAuthor: string;
}

/**
 * 피드백에서 @ai-agent 멘션 이후의 지시사항 추출
 */
function extractFeedback(commentBody: string): string {
  const match = commentBody.match(/@ai-agent\s+([\s\S]+)/i);
  return match ? match[1].trim() : commentBody;
}

/**
 * content/posts 디렉토리에서 가장 최근 MDX 파일 찾기
 */
function findLatestMdxFile(): string | null {
  const postsDir = path.join(process.cwd(), 'content', 'posts');

  if (!fs.existsSync(postsDir)) {
    return null;
  }

  const files = fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => ({
      name: f,
      path: path.join(postsDir, f),
      mtime: fs.statSync(path.join(postsDir, f)).mtime
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return files.length > 0 ? files[0].path : null;
}

/**
 * Gemini를 사용하여 피드백 반영
 */
async function applyFeedback(
  content: string,
  feedback: string
): Promise<string> {
  const prompt = `
다음은 블로그 포스트 콘텐츠입니다:

${content}

---

사용자의 피드백:
${feedback}

---

위 피드백을 반영하여 콘텐츠를 수정해주세요.
수정된 전체 콘텐츠(frontmatter 포함)를 반환해주세요.
`;

  const response = await geminiPro.invoke(prompt);
  return response.content.toString();
}

/**
 * 메인 실행 함수
 */
async function main() {
  const context: FeedbackContext = {
    prNumber: process.env.PR_NUMBER || '',
    commentBody: process.env.COMMENT_BODY || '',
    commentAuthor: process.env.COMMENT_AUTHOR || '',
  };

  console.log(`PR #${context.prNumber} 피드백 처리 시작`);
  console.log(`작성자: ${context.commentAuthor}`);

  // 피드백 추출
  const feedback = extractFeedback(context.commentBody);
  console.log(`피드백: ${feedback}`);

  // 최근 MDX 파일 찾기
  const mdxFile = findLatestMdxFile();
  if (!mdxFile) {
    console.error('MDX 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`대상 파일: ${mdxFile}`);

  // 파일 읽기
  const originalContent = fs.readFileSync(mdxFile, 'utf-8');

  // 피드백 반영
  const updatedContent = await applyFeedback(originalContent, feedback);

  // 파일 업데이트
  fs.writeFileSync(mdxFile, updatedContent, 'utf-8');

  console.log('피드백 반영 완료!');
}

main().catch(error => {
  console.error('피드백 처리 중 오류:', error);
  process.exit(1);
});
