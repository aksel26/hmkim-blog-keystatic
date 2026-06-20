import { getAllTechPosts, getTechTags } from '@/lib/keystatic/reader';
import TechArchive from '@/components/tech/TechArchive';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.blog';

export const metadata: Metadata = {
  title: 'Tech | HM Blog',
  description: 'React, Next.js, TypeScript, 웹 성능과 프론트엔드 개발 경험을 정리한 기술 글 모음입니다.',
  alternates: {
    canonical: `${baseUrl}/tech`,
  },
  openGraph: {
    title: 'Tech | HM Blog',
    description: 'React, Next.js, TypeScript, 웹 성능과 프론트엔드 개발 경험을 정리한 기술 글 모음입니다.',
    url: `${baseUrl}/tech`,
    type: 'website',
    siteName: 'HM Blog',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech | HM Blog',
    description: 'React, Next.js, TypeScript, 웹 성능과 프론트엔드 개발 경험을 정리한 기술 글 모음입니다.',
  },
};

export default async function TechPage() {
  const [posts, tags] = await Promise.all([
    getAllTechPosts(),
    getTechTags(),
  ]);

  return <TechArchive posts={posts.map(post => ({
    slug: post.slug,
    title: post.title || 'Untitled',
    summary: post.summary || '',
    createdAt: post.createdAt || '',
    tags: [...(post.tags || [])],
    thumbnailImage: post.thumbnailImage || undefined,
  }))} tags={tags} />;
}
