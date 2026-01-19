import { getAllLifePosts, getLifeTags } from '@/lib/keystatic/reader';
import LifeArchive from '@/components/life/LifeArchive';

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
