import { getAllLifePosts, getLifeTags } from '@/lib/keystatic/reader';
import LifeArchive from '@/components/life/LifeArchive';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.blog';

export const metadata: Metadata = {
  title: 'Life | HM Blog',
  description: '일상 기록, 영화와 공간 리뷰, 생산성, 투자와 라이프스타일에 대한 글 모음입니다.',
  alternates: {
    canonical: `${baseUrl}/life`,
  },
  openGraph: {
    title: 'Life | HM Blog',
    description: '일상 기록, 영화와 공간 리뷰, 생산성, 투자와 라이프스타일에 대한 글 모음입니다.',
    url: `${baseUrl}/life`,
    type: 'website',
    siteName: 'HM Blog',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Life | HM Blog',
    description: '일상 기록, 영화와 공간 리뷰, 생산성, 투자와 라이프스타일에 대한 글 모음입니다.',
  },
};

export default async function LifePage() {
  const [posts, tags] = await Promise.all([
    getAllLifePosts(),
    getLifeTags(),
  ]);

  return <LifeArchive posts={posts.map(post => ({
    slug: post.slug,
    title: post.title || 'Untitled',
    summary: post.summary || '',
    createdAt: post.createdAt || '',
    tags: [...(post.tags || [])],
    thumbnailImage: post.thumbnailImage || undefined,
    thumbnailVideo: post.thumbnailVideo || undefined,
  }))} tags={tags} />;
}
