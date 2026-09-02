/**
 * LLM 모델 설정
 *
 * 모든 에이전트가 gemini-2.0-flash 하나를 공유한다.
 * 이유: 무료 티어 한도 안에서 운영하기 위해 Pro 계열은 쓰지 않는다.
 * 과거에는 flash/pro/code 세 export가 있었지만 실제 설정이 전부 동일해 하나로 합쳤다.
 * 정확도가 필요해지면 여기서 model 값만 바꾸면 전 에이전트에 반영된다.
 */

import dotenv from 'dotenv';
import path from 'path';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// 환경 변수 로드 (루트 디렉토리의 .env.local)
// turbo는 apps/agent에서 실행하므로 2단계 상위로 이동
if (typeof process !== 'undefined' && process.env) {
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
}

/**
 * 환경 변수 검증 (필요시 사용)
 */
export function validateEnvVars() {
  const required = {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set them in your .env.local file.'
    );
  }
}

// 환경 변수는 런타임에 체크 (import 시점이 아닌)

/**
 * 공용 Gemini 모델 - 리서치, 초안, 검토, 메타데이터 생성 전부 이 인스턴스를 사용
 */
export const gemini = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.7,
  maxOutputTokens: 8192,
  // 호출 실패는 LangChain AsyncCaller가 지수 백오프로 재시도한다. 무료 티어 429가 주 대상.
  // Gemini SDK 오류는 response.status가 없어 AsyncCaller의 4xx 제외 목록이 적용되지 않고
  // 모든 실패를 재시도하므로, 기본값 6 대신 3으로 상한을 둔다.
  maxRetries: 3,
});
