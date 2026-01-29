---
name: seo-optimization
description: 블로그 SEO(검색 엔진 최적화) 전문 스킬. 메타데이터, sitemap, robots.txt, 구조화된 데이터, 캐노니컬 URL 등 기술적 SEO 구현을 담당합니다.
triggers:
  - "SEO 최적화해줘"
  - "메타데이터 추가해줘"
  - "sitemap 생성해줘"
  - "검색 최적화"
---

# SEO 최적화 스킬

## 개요
이 스킬은 Next.js 블로그 앱의 SEO(Search Engine Optimization)를 담당합니다.
검색 엔진이 콘텐츠를 효과적으로 크롤링하고 인덱싱할 수 있도록 기술적 최적화를 수행합니다.

## 핵심 영역

### 1. 메타데이터 최적화
- **동적 generateMetadata**: 각 포스트별 title, description, keywords 자동 생성
- **Open Graph 태그**: 소셜 미디어 공유 최적화
- **Twitter Card**: Twitter 전용 메타 태그
- **캐노니컬 URL**: 중복 콘텐츠 방지

```typescript
// app/[category]/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.summary,
    keywords: post.keywords,
    alternates: {
      canonical: `https://yourdomain.com/${params.category}/${params.slug}`,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.summary,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      authors: ['작성자명'],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
    },
  };
}
```

### 2. 구조화된 데이터 (JSON-LD)
- **Article/BlogPosting 스키마**: 기사 구조 정의
- **BreadcrumbList**: 네비게이션 경로
- **Organization/Person**: 작성자 정보
- **WebSite**: 사이트 검색 기능

```typescript
// components/StructuredData.tsx
export function ArticleSchema({ post }: { post: Post }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: '작성자명',
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
      '@id': `https://yourdomain.com/${post.category}/${post.slug}`,
    },
    keywords: post.keywords?.join(', '),
    image: post.thumbnailImage,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 3. 기술적 SEO 파일
- **robots.txt**: 크롤러 접근 규칙
- **sitemap.xml**: 동적 사이트맵 생성
- **manifest.json**: PWA 메타데이터

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const postEntries = posts.map((post) => ({
    url: `https://yourdomain.com/${post.category}/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: 'https://yourdomain.com', lastModified: new Date(), priority: 1 },
    { url: 'https://yourdomain.com/tech', lastModified: new Date(), priority: 0.9 },
    { url: 'https://yourdomain.com/life', lastModified: new Date(), priority: 0.9 },
    { url: 'https://yourdomain.com/me', lastModified: new Date(), priority: 0.7 },
    ...postEntries,
  ];
}
```

### 4. 성능 기반 SEO
- **Core Web Vitals**: LCP, FID, CLS 최적화
- **이미지 최적화**: WebP/AVIF, lazy loading
- **폰트 최적화**: font-display: swap
- **코드 스플리팅**: 번들 사이즈 최적화

## 체크리스트

### 필수 구현 항목
- [ ] 모든 페이지에 고유한 title, description
- [ ] Open Graph 이미지 (1200x630)
- [ ] 캐노니컬 URL 설정
- [ ] sitemap.xml 자동 생성
- [ ] robots.txt 설정
- [ ] JSON-LD 구조화 데이터
- [ ] 모바일 반응형 디자인
- [ ] HTTPS 적용
- [ ] 404/500 페이지 최적화

### 권장 구현 항목
- [ ] 빵부스러기(Breadcrumb) 네비게이션
- [ ] FAQ 스키마 (Q&A 콘텐츠)
- [ ] 이미지 alt 텍스트 최적화
- [ ] 내부 링크 전략
- [ ] 페이지 로딩 속도 < 3초

## 참고 자료
- [Google Search Central](https://developers.google.com/search/docs)
- [Schema.org](https://schema.org/)
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
