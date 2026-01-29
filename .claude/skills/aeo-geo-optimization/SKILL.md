---
name: aeo-geo-optimization
description: AEO(Answer Engine Optimization) 및 GEO(Generative Engine Optimization) 최적화 스킬. AI 검색 엔진과 생성형 AI가 콘텐츠를 이해하고 인용할 수 있도록 최적화합니다.
triggers:
  - "AEO 최적화해줘"
  - "GEO 최적화해줘"
  - "AI 검색 최적화"
  - "ChatGPT/Perplexity 최적화"
---

# AEO/GEO 최적화 스킬

## 개요

### AEO (Answer Engine Optimization)
Google Featured Snippets, People Also Ask, Voice Search 등 **답변 중심 검색 결과**에 최적화합니다.

### GEO (Generative Engine Optimization)
ChatGPT, Perplexity, Gemini, Claude 등 **생성형 AI 검색 엔진**이 콘텐츠를 인용하고 참조할 수 있도록 최적화합니다.

## AEO 핵심 전략

### 1. 질문-답변 구조 콘텐츠
```markdown
## Next.js란 무엇인가?

Next.js는 React 기반의 풀스택 웹 프레임워크입니다.
서버 사이드 렌더링(SSR), 정적 사이트 생성(SSG),
API 라우트를 기본 제공하여 SEO 친화적인 웹 앱을 쉽게 구축할 수 있습니다.
```

### 2. FAQ 스키마 구현
```typescript
// components/FAQSchema.tsx
export function FAQSchema({ faqs }: { faqs: FAQ[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 3. HowTo 스키마 (튜토리얼)
```typescript
const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Next.js 프로젝트 시작하기',
  description: 'Next.js 프로젝트를 처음부터 설정하는 방법',
  step: [
    {
      '@type': 'HowToStep',
      name: '프로젝트 생성',
      text: 'npx create-next-app@latest 명령어로 프로젝트를 생성합니다.',
    },
    {
      '@type': 'HowToStep',
      name: '개발 서버 실행',
      text: 'npm run dev로 개발 서버를 실행합니다.',
    },
  ],
};
```

### 4. 정의/용어 구조
```markdown
## 핵심 용어 정의

**SSR (Server-Side Rendering)**
: 서버에서 HTML을 생성하여 클라이언트에 전달하는 렌더링 방식입니다.

**SSG (Static Site Generation)**
: 빌드 시점에 HTML을 미리 생성하여 CDN에서 제공하는 방식입니다.
```

## GEO 핵심 전략

### 1. 명확한 출처 정보
AI 모델이 신뢰할 수 있는 출처로 인식하도록 합니다.

```typescript
// 저자 정보 명시
const authorSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: '홍길동',
  jobTitle: '시니어 프론트엔드 개발자',
  url: 'https://yourdomain.com/me',
  sameAs: [
    'https://github.com/username',
    'https://linkedin.com/in/username',
  ],
};
```

### 2. 인용 가능한 문장 구조
- **핵심 정보를 첫 문장에** 배치
- **정확한 수치와 데이터** 포함
- **전문 용어 정의** 포함

```markdown
## Next.js 15의 주요 변경사항

Next.js 15는 2024년 10월에 출시되었으며,
React 19 지원과 Turbopack 안정화가 핵심 업데이트입니다.

### 성능 개선
- 빌드 시간: 평균 50% 단축
- 콜드 스타트: 25% 개선
- 번들 사이즈: 최대 30% 감소
```

### 3. 구조화된 요약
```typescript
// components/TLDRSection.tsx
export function TLDRSection({ summary }: { summary: string }) {
  return (
    <aside className="tldr-box" aria-label="요약">
      <h2>TL;DR (요약)</h2>
      <p>{summary}</p>
    </aside>
  );
}
```

### 4. 참조 및 인용
```markdown
## 참고 자료

1. [Next.js 공식 문서](https://nextjs.org/docs) - 공식 가이드
2. [Vercel 블로그](https://vercel.com/blog) - 최신 업데이트
3. [React 문서](https://react.dev) - React 핵심 개념
```

### 5. 메타 정보 강화
```typescript
export const metadata: Metadata = {
  title: '제목',
  description: '설명',
  // AI 검색 엔진용 추가 메타데이터
  other: {
    'article:author': '작성자명',
    'article:published_time': '2024-01-15',
    'article:modified_time': '2024-01-20',
    'article:section': 'Technology',
    'article:tag': 'Next.js, React, Web Development',
  },
};
```

## 콘텐츠 작성 가이드라인

### AEO 최적화 콘텐츠 구조
1. **제목**: 질문 형태 또는 명확한 주제
2. **첫 단락**: 핵심 답변 (40-60자)
3. **본문**: 상세 설명, 예시, 코드
4. **목록/표**: 스캔 가능한 정보
5. **결론**: 핵심 요약

### GEO 최적화 콘텐츠 구조
1. **TL;DR 섹션**: 3줄 요약
2. **명확한 정의**: 용어 설명
3. **구체적 데이터**: 수치, 날짜, 버전
4. **출처 명시**: 참고 링크
5. **저자 신뢰도**: 전문성 표시

## 기술 구현

### Featured Snippet 최적화
```typescript
// components/DefinitionBox.tsx
export function DefinitionBox({ term, definition }: Props) {
  return (
    <dl className="definition-box" itemScope itemType="https://schema.org/DefinedTerm">
      <dt itemProp="name">{term}</dt>
      <dd itemProp="description">{definition}</dd>
    </dl>
  );
}
```

### 테이블 최적화 (AI 인용 용이)
```typescript
// components/ComparisonTable.tsx
export function ComparisonTable({ data }: Props) {
  return (
    <figure>
      <table aria-describedby="table-description">
        <caption id="table-description">SSR vs SSG 비교표</caption>
        <thead>
          <tr>
            <th scope="col">특성</th>
            <th scope="col">SSR</th>
            <th scope="col">SSG</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.feature}>
              <th scope="row">{row.feature}</th>
              <td>{row.ssr}</td>
              <td>{row.ssg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
```

## 체크리스트

### AEO 필수 항목
- [ ] 질문형 H2/H3 헤딩 사용
- [ ] 첫 단락에 핵심 답변
- [ ] FAQ 스키마 구현
- [ ] 정의 목록(dl/dt/dd) 활용
- [ ] 단계별 가이드(HowTo) 구조

### GEO 필수 항목
- [ ] TL;DR 섹션 추가
- [ ] 저자 정보 및 신뢰도 표시
- [ ] 정확한 날짜/버전 정보
- [ ] 참고 자료 링크
- [ ] 인용하기 쉬운 문장 구조
- [ ] 구조화된 데이터(JSON-LD)

## 참고 자료
- [Google Featured Snippets 가이드](https://developers.google.com/search/docs/appearance/featured-snippets)
- [Schema.org FAQPage](https://schema.org/FAQPage)
- [Perplexity AI 인용 가이드](https://www.perplexity.ai/)
