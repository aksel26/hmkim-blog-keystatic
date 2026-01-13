import { getAllLifePosts } from '@/lib/keystatic/reader';
import LifeArchive from '@/components/life/LifeArchive';

export default async function LifePage() {
  const posts = await getAllLifePosts();

  return <LifeArchive posts={posts.map(post => ({
    ...post,
    title: post.title || 'Untitled',
    visitDate: post.visitDate || '',
    rating: post.rating || undefined,
    category: post.category || 'restaurant',
    thumbnail: post.thumbnail || undefined,
    gallery: post.gallery ? post.gallery.filter((item): item is string => typeof item === 'string') : undefined,
  }))} />;
}
