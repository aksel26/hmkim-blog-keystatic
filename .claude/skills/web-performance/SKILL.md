---
name: web-performance
description: 웹 성능 최적화 스킬. Core Web Vitals(LCP, FID, CLS, INP) 개선, 이미지/폰트 최적화, 코드 스플리팅, 캐싱 전략을 담당합니다.
triggers:
  - "성능 최적화해줘"
  - "Core Web Vitals 개선"
  - "페이지 속도 개선"
  - "LCP 최적화"
---

# 웹 성능 최적화 스킬

## 개요
이 스킬은 블로그의 웹 성능을 최적화합니다.
Google의 Core Web Vitals는 SEO 랭킹 요소이므로 성능 최적화는 SEO와 직결됩니다.

## Core Web Vitals 목표

| 지표 | 설명 | 목표값 |
|------|------|--------|
| **LCP** | Largest Contentful Paint | < 2.5초 |
| **INP** | Interaction to Next Paint | < 200ms |
| **CLS** | Cumulative Layout Shift | < 0.1 |

## 1. LCP (Largest Contentful Paint) 최적화

### 이미지 최적화
```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
};
```

### Priority 이미지 로딩
```tsx
// Hero 이미지나 첫 번째 포스트 썸네일
<Image
  src={heroImage}
  alt="Hero"
  priority // LCP 요소에 반드시 추가
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 폰트 최적화
```typescript
// app/layout.tsx
import localFont from 'next/font/local';

const mainFont = localFont({
  src: './fonts/font.woff2',
  display: 'swap', // FOIT 방지
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});
```

### Preload 중요 리소스
```tsx
// app/layout.tsx
export const metadata: Metadata = {
  other: {
    'link': [
      { rel: 'preload', href: '/hero.webp', as: 'image' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    ],
  },
};
```

## 2. INP (Interaction to Next Paint) 최적화

### 이벤트 핸들러 최적화
```typescript
// 나쁜 예 - 메인 스레드 블로킹
const handleClick = () => {
  heavyComputation(); // 동기 실행
};

// 좋은 예 - 비동기 처리
const handleClick = async () => {
  requestAnimationFrame(() => {
    // UI 업데이트
  });
  await heavyComputation();
};
```

### React 동시성 기능 활용
```typescript
import { useTransition, useDeferredValue } from 'react';

function SearchComponent() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const handleSearch = (value: string) => {
    setQuery(value);
    startTransition(() => {
      // 낮은 우선순위 업데이트
      performSearch(value);
    });
  };
}
```

### 코드 스플리팅
```typescript
// 동적 import로 번들 분리
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  {
    loading: () => <Skeleton />,
    ssr: false, // 클라이언트 전용
  }
);
```

## 3. CLS (Cumulative Layout Shift) 최적화

### 이미지 크기 명시
```tsx
// 항상 width, height 명시 또는 aspect-ratio 사용
<Image
  src={thumbnail}
  alt="Thumbnail"
  width={800}
  height={450}
  className="aspect-video"
/>
```

### 스켈레톤 UI
```tsx
// components/PostCardSkeleton.tsx
export function PostCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-gray-200 rounded-lg" />
      <div className="h-6 bg-gray-200 rounded mt-4 w-3/4" />
      <div className="h-4 bg-gray-200 rounded mt-2 w-1/2" />
    </div>
  );
}
```

### 폰트 FOUT 방지
```css
/* font-display: swap과 함께 fallback 크기 조정 */
@font-face {
  font-family: 'CustomFont';
  src: url('/font.woff2') format('woff2');
  font-display: swap;
  size-adjust: 100%;
  ascent-override: 90%;
  descent-override: 20%;
}
```

### 광고/임베드 공간 예약
```tsx
// 외부 콘텐츠 공간 미리 확보
<div className="min-h-[250px]"> {/* 광고 높이 예약 */}
  <AdComponent />
</div>
```

## 4. 캐싱 전략

### Next.js 캐싱
```typescript
// app/api/posts/route.ts
export const revalidate = 3600; // 1시간마다 재검증

// 또는 동적 재검증
import { revalidatePath } from 'next/cache';
revalidatePath('/tech');
```

### 정적 생성 + ISR
```typescript
// app/[category]/[slug]/page.tsx
export const dynamicParams = true;
export const revalidate = 86400; // 24시간

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    category: post.category,
    slug: post.slug,
  }));
}
```

### HTTP 캐싱 헤더
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

## 5. 번들 최적화

### 트리 쉐이킹
```typescript
// 나쁜 예 - 전체 라이브러리 import
import { format } from 'date-fns';

// 좋은 예 - 필요한 함수만 import
import format from 'date-fns/format';
```

### 번들 분석
```bash
# 번들 분석 실행
ANALYZE=true pnpm build

# 또는
npx @next/bundle-analyzer
```

### 외부 라이브러리 최적화
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};
```

## 6. 성능 모니터링

### web-vitals 라이브러리
```typescript
// lib/vitals.ts
import { onLCP, onINP, onCLS } from 'web-vitals';

export function reportWebVitals() {
  onLCP(console.log);
  onINP(console.log);
  onCLS(console.log);
}

// app/layout.tsx (Client Component)
'use client';
import { reportWebVitals } from '@/lib/vitals';
import { useEffect } from 'react';

export function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals();
  }, []);
  return null;
}
```

### Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
```

## 체크리스트

### LCP 최적화
- [ ] Hero 이미지에 `priority` 속성
- [ ] 이미지 포맷: WebP/AVIF
- [ ] 폰트 `display: swap`
- [ ] 중요 리소스 preload

### INP 최적화
- [ ] 동적 import 활용
- [ ] useTransition/useDeferredValue
- [ ] 이벤트 핸들러 최적화
- [ ] Web Worker 활용 (필요시)

### CLS 최적화
- [ ] 모든 이미지에 크기 명시
- [ ] 스켈레톤 UI 적용
- [ ] 폰트 fallback 설정
- [ ] 동적 콘텐츠 공간 예약

### 캐싱
- [ ] ISR 설정
- [ ] 정적 자산 캐싱 헤더
- [ ] API 응답 캐싱

## 참고 자료
- [web.dev Core Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
