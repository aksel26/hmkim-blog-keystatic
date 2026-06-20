import { getAllPosts } from '@/lib/keystatic/reader';
import HomeContent from '@/components/home/HomeContent';
import { Post } from '@/components/home/MasonryGrid';
import { WebSiteSchema } from '@/components/schema';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.blog';

export const metadata: Metadata = {
  title: 'HM Blog - Tech & Life',
  description: '프론트엔드 개발과 일상, 투자와 생산성에 대한 기록을 나눕니다.',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'HM Blog - Tech & Life',
    description: '프론트엔드 개발과 일상, 투자와 생산성에 대한 기록을 나눕니다.',
    url: baseUrl,
    type: 'website',
    siteName: 'HM Blog',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HM Blog - Tech & Life',
    description: '프론트엔드 개발과 일상, 투자와 생산성에 대한 기록을 나눕니다.',
  },
};

export default async function Home() {
  const posts = await getAllPosts();

  const allPosts: Post[] = posts.map((post) => ({
    slug: post.slug,
    title: post.title || 'Untitled',
    summary: post.summary || '',
    category: post.category || 'tech',
    tags: post.tags || [],
    createdAt: post.createdAt || '',
    thumbnailImage: post.thumbnailImage || undefined,
    thumbnailVideo: post.thumbnailVideo || undefined,
  }));

  return (
    <>
      <WebSiteSchema />
      <HomeContent initialPosts={allPosts} />
    </>
  );
}
