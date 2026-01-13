import { getAllTechPosts, getAllLifePosts } from '@/lib/keystatic/reader';
import HomeContent from '@/components/home/HomeContent';
import { Post } from '@/components/home/MasonryGrid';

export default async function Home() {
  const [techPosts, lifePosts] = await Promise.all([
    getAllTechPosts(),
    getAllLifePosts(),
  ]);

  const allPosts: Post[] = ([
    ...techPosts.map((post) => ({
      ...post,
      title: post.title || 'Untitled',
      type: 'tech' as const,
      publishedAt: post.publishedAt || '', // Ensure string
    })),
    ...lifePosts.map((post) => ({
      ...post,
      title: post.title || 'Untitled',
      type: 'life' as const,
      visitDate: post.visitDate || '', // Ensure string
    })),
  ] as Post[]).sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.visitDate || '');
    const dateB = new Date(b.publishedAt || b.visitDate || '');
    return dateB.getTime() - dateA.getTime();
  });

  return <HomeContent initialPosts={allPosts} />;
}
