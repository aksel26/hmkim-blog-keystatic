## 🤖 Turborepo 마이그레이션 실행 프롬프트

**목표:** 기존 Next.js 블로그 레포지토리를 Turborepo 기반의 모노레포 구조로 전환하고, 외부 AI 에이전트 프로젝트를 통합한다.

### 1. 초기 준비 및 브랜치 생성

* 현재 작업 트리를 확인하고, `feature/migrate-to-turborepo` 브랜치를 새로 생성하여 이동해줘.

### 2. Turborepo 기반 모노레포 구조 설정

* 최신 Turborepo(v2.x+) 가이드를 따라 루트 설정을 진행해줘.
* 루트 디렉토리에 `apps/` 및 `packages/` 폴더를 생성해.
* 루트 `package.json`을 수정하여 워크스페이스를 설정해 (pnpm을 권장하며, 사용 중인 패키지 매니저에 맞게 설정).
* `turbo.json` 파일을 생성하고, `build`, `dev`, `lint` 파이프라인을 구성해.

### 3. App 1: 기존 블로그 프로젝트 이동 (`apps/blog`)

* 루트에 있는 모든 기존 블로그 관련 파일(Next.js, Keystatic 설정, content 등)을 `apps/blog` 폴더로 이동시켜줘.
* **경로 수정:** `apps/blog/keystatic.config.ts` 및 기타 설정 파일에서 상대 경로가 깨지지 않도록 검토하고 수정해.
* 이동 후 `apps/blog` 내에서 `pnpm dev`(또는 사용 중인 매니저 명령어)가 정상 작동하는지 확인하기 위한 스크립트를 루트 `package.json`에 추가해 (`"dev:blog": "turbo dev --filter=blog"`).
* Keystatic 경로를 적절하게 맞춰줘. 마이그레이션 후 Keystatic 관리자 페이지에서 이미지가 안 보이거나 글 저장이 안 된다면 대부분 `keystatic.config.ts` 내의 `storage` 경로 설정 문제입니다.

### 4. App 2: AI 에이전트 통합 (`apps/agent`)

* `https://github.com/aksel26/MultiAgent-Blog-.git` 저장소의 코드를 `apps/agent` 디렉토리로 불러와줘.
* 에이전트 프로젝트의 의존성을 모노레포 루트의 패키지 매니저와 통합해.
* 에이전트가 블로그의 콘텐츠 폴더(`apps/blog/content`)를 참조하여 글을 작성하거나 읽을 수 있도록 에이전트 내부의 경로 설정 변수를 찾아 모노레포 구조에 맞게 수정해.
* 이후 해당 레포지토리에 PR을 요청하는 로직을 작업할 예정이므로 이점 고려해줘.

### 5. 환경 변수 및 빌드 설정 최적화

* 루트에 `.env.example`을 만들고, 두 앱(`blog`, `agent`)에 필요한 모든 환경 변수 목록을 정리해.
* Vercel 배포를 고려하여, `apps/blog`의 빌드 명령어가 정상적으로 실행되도록 루트 스크립트를 최종 점검해.

### 6. 검증

* 모든 작업이 완료되면 `turbo build`를 실행하여 전체 프로젝트에 타입 에러나 빌드 오류가 없는지 확인해줘.


