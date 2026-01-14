import { getAllTechPosts, getTechTags } from '@/lib/keystatic/reader';
import TechArchive from '@/components/tech/TechArchive';

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
