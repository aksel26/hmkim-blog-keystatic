---
name: structured-data
description: Schema.org 구조화된 데이터(JSON-LD) 구현 스킬. Article, FAQPage, BreadcrumbList, HowTo 등 다양한 스키마를 블로그에 적용합니다.
triggers:
  - "JSON-LD 추가해줘"
  - "구조화 데이터 추가"
  - "스키마 마크업"
  - "리치 결과 최적화"
---

# 구조화된 데이터 스킬

## 개요
Schema.org 기반 JSON-LD 구조화된 데이터를 구현하여
Google 리치 결과(Rich Results)에 노출되도록 최적화합니다.

## 지원 스키마 유형

### 1. BlogPosting (블로그 포스트)
```typescript
// components/schema/BlogPostingSchema.tsx
interface BlogPostingSchemaProps {
  title: string;
  description: string;
  slug: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
  author: string;
  thumbnailImage?: string;
  keywords?: string[];
  wordCount?: number;
}

export function BlogPostingSchema(props: BlogPostingSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: props.title,
    description: props.description,
    image: props.thumbnailImage,
    datePublished: props.createdAt,
    dateModified: props.updatedAt || props.createdAt,
    author: {
      '@type': 'Person',
      name: props.author,
      url: 'https://yourdomain.com/me',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HM Blog',
      logo: {
        '@type': 'ImageObject',
        url: 'https://yourdomain.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://yourdomain.com/${props.category}/${props.slug}`,
    },
    keywords: props.keywords?.join(', '),
    wordCount: props.wordCount,
    articleSection: props.category,
    inLanguage: 'ko-KR',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 2. BreadcrumbList (경로 탐색)
```typescript
// components/schema/BreadcrumbSchema.tsx
interface Breadcrumb {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: Breadcrumb[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// 사용 예시
<BreadcrumbSchema
  items={[
    { name: 'Home', url: 'https://yourdomain.com' },
    { name: 'Tech', url: 'https://yourdomain.com/tech' },
    { name: 'Next.js 가이드', url: 'https://yourdomain.com/tech/nextjs-guide' },
  ]}
/>
```

### 3. FAQPage (자주 묻는 질문)
```typescript
// components/schema/FAQSchema.tsx
interface FAQ {
  question: string;
  answer: string;
}

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

### 4. HowTo (단계별 가이드)
```typescript
// components/schema/HowToSchema.tsx
interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration (예: "PT30M")
}

export function HowToSchema(props: HowToSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: props.name,
    description: props.description,
    totalTime: props.totalTime,
    step: props.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
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

### 5. WebSite (사이트 검색)
```typescript
// components/schema/WebSiteSchema.tsx
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HM Blog',
    url: 'https://yourdomain.com',
    description: 'Tech & Life 이야기를 전합니다.',
    inLanguage: 'ko-KR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://yourdomain.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 6. Person (저자 프로필)
```typescript
// components/schema/PersonSchema.tsx
export function PersonSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: '홍길동',
    jobTitle: '시니어 프론트엔드 개발자',
    url: 'https://yourdomain.com/me',
    image: 'https://yourdomain.com/profile.jpg',
    description: 'Tech & Life 블로그를 운영하는 개발자입니다.',
    sameAs: [
      'https://github.com/username',
      'https://linkedin.com/in/username',
      'https://twitter.com/username',
    ],
    knowsAbout: ['React', 'Next.js', 'TypeScript', 'Web Development'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 7. Organization (사이트 조직)
```typescript
// components/schema/OrganizationSchema.tsx
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HM Blog',
    url: 'https://yourdomain.com',
    logo: 'https://yourdomain.com/logo.png',
    sameAs: [
      'https://github.com/username',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@yourdomain.com',
      contactType: 'customer service',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

## 통합 스키마 컴포넌트

```typescript
// components/schema/index.tsx
import { BlogPostingSchema } from './BlogPostingSchema';
import { BreadcrumbSchema } from './BreadcrumbSchema';
import { FAQSchema } from './FAQSchema';

interface PostSchemaProps {
  post: Post;
  faqs?: FAQ[];
}

export function PostStructuredData({ post, faqs }: PostSchemaProps) {
  const breadcrumbs = [
    { name: 'Home', url: 'https://yourdomain.com' },
    { name: post.category === 'tech' ? 'Tech' : 'Life', url: `https://yourdomain.com/${post.category}` },
    { name: post.title, url: `https://yourdomain.com/${post.category}/${post.slug}` },
  ];

  return (
    <>
      <BlogPostingSchema
        title={post.title}
        description={post.summary}
        slug={post.slug}
        category={post.category}
        createdAt={post.createdAt}
        updatedAt={post.updatedAt}
        author="홍길동"
        thumbnailImage={post.thumbnailImage}
        keywords={post.keywords}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      {faqs && faqs.length > 0 && <FAQSchema faqs={faqs} />}
    </>
  );
}
```

## 페이지별 적용

### 홈페이지
```tsx
// app/page.tsx
<WebSiteSchema />
<OrganizationSchema />
```

### 포스트 페이지
```tsx
// app/[category]/[slug]/page.tsx
<PostStructuredData post={post} />
```

### 저자 페이지
```tsx
// app/me/page.tsx
<PersonSchema />
```

## 검증 도구

### Google Rich Results Test
```
https://search.google.com/test/rich-results
```

### Schema Markup Validator
```
https://validator.schema.org/
```

## 체크리스트

### 필수 스키마
- [ ] BlogPosting - 모든 포스트
- [ ] BreadcrumbList - 네비게이션 경로
- [ ] WebSite - 사이트 정보
- [ ] Person/Organization - 저자/발행자

### 권장 스키마
- [ ] FAQPage - Q&A 형식 콘텐츠
- [ ] HowTo - 튜토리얼/가이드
- [ ] ItemList - 포스트 목록 페이지

### 검증
- [ ] Google Rich Results Test 통과
- [ ] Search Console에서 에러 없음
- [ ] 모든 필수 필드 포함

## 참고 자료
- [Schema.org](https://schema.org/)
- [Google Structured Data](https://developers.google.com/search/docs/appearance/structured-data)
- [Rich Results Test](https://search.google.com/test/rich-results)
