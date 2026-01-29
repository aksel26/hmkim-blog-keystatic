import { getAllPosts } from '@/lib/keystatic/reader';
import HomeContent from '@/components/home/HomeContent';
import { Post } from '@/components/home/MasonryGrid';
import { WebSiteSchema } from '@/components/schema';

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
