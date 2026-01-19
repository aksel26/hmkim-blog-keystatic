
1단계: 프로젝트 초기 설정

Next.js 블로그 프로젝트에 AI 멀티에이전트 시스템을 구축해줘.

프로젝트 구조:
- ai-agents/ 폴더 생성
  - config/ (LLM 설정)
  - workflows/ (메인 워크플로우)
  - agents/ (각 에이전트)
  - tools/ (유틸리티)
  - types/ (타입 정의)
- scripts/ 폴더 생성
  - generate-post-interactive.ts

필요한 패키지 설치:
npm install @langchain/core @langchain/langgraph @langchain/anthropic @langchain/google-genai @langchain/community inquirer chalk ora simple-git @types/inquirer

폴더 구조만 먼저 생성해줘.

---

2단계: 타입 정의 생성

ai-agents/types/workflow.ts 파일을 생성해줘.

다음 인터페이스를 포함:

1. BlogPostState: 워크플로우 전체 상태 관리
   - topic, currentStep, progress
   - researchData (sources, summary, keyPoints)
   - draftContent
   - humanApproval, humanFeedback
   - finalContent, images
   - metadata (title, description, tags, slug)
   - filepath
   - validationResult (passed, errors)
   - commitHash

2. StreamEvent: 진행 상황 이벤트
   - step, status, message, data

TypeScript로 타입을 정확하게 정의해줘.

---

3단계: LLM 설정
ai-agents/config/models.ts 파일을 생성해줘.

다음 3가지 모델 설정:
1. geminiFlash: Google Gemini 2.0 Flash (빠른 작업용)
2. claudeSonnet: Claude Sonnet 4 (정교한 작업용)
3. claudeCode: Claude Sonnet 4 (코드 실행용)

환경변수 사용:
- GOOGLE_API_KEY
- ANTHROPIC_API_KEY

---

4단계: 에이전트 구현 (하나씩)
Gemini Researcher
ai-agents/agents/gemini-researcher.ts 파일을 생성해줘.

기능:
1. Tavily Search API로 웹 검색
2. Gemini Flash로 검색 결과 요약
3. JSON 형식으로 researchData 반환 (sources, summary, keyPoints)
4. onProgress 콜백으로 진행 상황 전달

onProgress 이벤트:
- started: 리서치 시작
- progress: 검색 결과 수 표시
- completed: 완료
Gemini Writer
ai-agents/agents/gemini-writer.ts 파일을 생성해줘.

기능:
1. researchData를 바탕으로 블로그 초안 작성
2. Gemini Flash 사용
3. Markdown 형식으로 반환
4. 프론트엔드 개발자 톤으로 작성

구조:
- 서론 (문제 제기)
- 본론 (개념 설명, 코드 예제, 실무 사례)
- 결론 (핵심 정리, 다음 학습)

onProgress 이벤트로 진행 상황 전달
Claude Creator
ai-agents/agents/claude-creator.ts 파일을 생성해줘.

기능:
1. draftContent를 받아서 개선
2. humanFeedback이 있으면 반영
3. Claude Sonnet 사용
4. 메타데이터 자동 생성 (title, description, tags, slug)
5. JSON 형식으로 메타데이터 반환

메타데이터 규칙:
- title: 60자 이내, SEO 최적화
- description: 150자 이내
- tags: 3-5개
- slug: URL-friendly
Validator
ai-agents/agents/validator.ts 파일을 생성해줘.

검증 항목:
1. 파일 존재 여부
2. 메타데이터 유효성 (title, description, tags 길이)
3. 콘텐츠 최소 길이 (500자)
4. 코드 블록 닫힘 확인 (``` 짝수)

반환:
- validationResult: { passed: boolean, errors: string[] }

---

5단계: 유틸리티 도구
File Manager
ai-agents/tools/file-manager.ts 파일을 생성해줘.

createMdxFile 함수:
1. metadata와 finalContent로 MDX 파일 생성
2. frontmatter 형식으로 메타데이터 포함
3. content/posts/ 디렉토리에 저장
4. 파일명: YYYY-MM-DD-slug.mdx
5. 디렉토리 없으면 자동 생성
6. 파일 경로 반환

onProgress 이벤트 전달
Git Manager
ai-agents/tools/git-manager.ts 파일을 생성해줘.

gitCommitAndPush 함수:
1. simple-git 사용
2. 생성된 파일 git add
3. 커밋 메시지: "feat: Add new post - {title}"
4. git push
5. 커밋 해시 반환

onProgress 이벤트:
- started: 준비 중
- progress: 커밋 중, Push 중
- completed: 완료 (커밋 해시 표시)

---
6단계: 메인 워크플로우
ai-agents/workflows/blog-workflow.ts 파일을 생성해줘.

LangGraph를 사용한 워크플로우:

노드:
1. research - Gemini로 리서치
2. write - Gemini로 초안 작성
3. humanReview - 사람 검토 대기
4. create - Claude로 콘텐츠 정제
5. createFile - MDX 파일 생성
6. validate - 검증
7. deploy - Git 커밋 & Push

엣지:
- research → write
- write → humanReview
- humanReview → (조건부) create or write
  - humanApproval === true → create
  - humanApproval === false → write (다시 작성)
- create → createFile
- createFile → validate
- validate → deploy
- deploy → END

조건부 엣지:
shouldContinue 함수로 humanApproval 체크

onProgress 콜백을 모든 단계에 전달

---

7단계: 인터랙티브 CLI
scripts/generate-post-interactive.ts 파일을 생성해줘.

기능:
1. inquirer로 주제 입력받기
2. 워크플로우 실행 (스트리밍)
3. ora 스피너로 진행 상황 표시
4. chalk로 컬러풀한 출력

humanReview 처리:
1. 초안 미리보기 (처음 500자)
2. 3가지 선택지:
   - 승인 (다음 단계로)
   - 수정 요청 (피드백 입력)
   - 다시 작성
3. 선택에 따라 state 업데이트

최종 결과 출력:
- 파일 경로
- 커밋 해시
- 제목, 태그

onProgress 이벤트 핸들링:
- started: ora spinner 시작
- progress: spinner.text 업데이트
- completed: spinner.succeed
- error: spinner.fail

---

8단계: package.json 스크립트 추가
package.json에 다음 스크립트를 추가해줘:

"scripts": {
  "generate-post": "tsx scripts/generate-post-interactive.ts"
}

---

9단계: 환경 변수 템플릿
.env.local.example 파일을 생성해줘:

# Google AI (Gemini)
GOOGLE_API_KEY=your_gemini_api_key_here

# Anthropic (Claude)
ANTHROPIC_API_KEY=your_claude_api_key_here

# Web Search (Optional)
TAVILY_API_KEY=your_tavily_api_key_here

.gitignore에 .env.local이 포함되어 있는지 확인해줘.

---

10단계: README 작성
AI-AGENTS-README.md 파일을 생성해줘.

내용:
1. 프로젝트 개요
2. 아키텍처 설명 (다이어그램)
3. 설치 방법
4. 환경 변수 설정
5. 사용 방법
6. 각 에이전트 역할 설명
7. 커스터마이징 가이드
8. 트러블슈팅

Markdown 형식으로 상세하게 작성해줘.

---

11단계: 테스트 실행
다음을 순서대로 실행해줘:

1. npm install로 모든 패키지 설치 확인
2. TypeScript 컴파일 에러 확인
3. 샘플 주제로 테스트 실행:
   npm run generate-post
   주제: "Next.js 15 App Router 완벽 가이드"

에러가 있으면 수정해줘.