/**
 * LLM 모델 설정
 * 모든 에이전트는 Gemini Pro를 사용합니다.
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
 * Gemini Flash - 빠른 작업용
 * 리서치, 초안 작성 등 빠른 응답이 필요한 작업에 사용
 */
export const geminiFlash = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.7,
  maxOutputTokens: 8192,
});

/**
 * Gemini Pro - 정교한 작업용 (무료 모델 사용)
 * 콘텐츠 개선, 메타데이터 생성 등 정교한 작업에 사용
 */
export const geminiPro = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.7,
  maxOutputTokens: 8192,
});

/**
 * Gemini Code - 코드/구조화 작업용 (무료 모델 사용)
 * 구조화된 출력이 필요한 작업에 사용 (낮은 temperature)
 */
export const geminiCode = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.5,
  maxOutputTokens: 8192,
});
