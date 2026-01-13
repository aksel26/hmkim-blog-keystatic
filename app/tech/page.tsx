import { getAllTechPosts, getAllTags } from '@/lib/keystatic/reader';
import TechArchive from '@/components/tech/TechArchive';

export default async function TechPage() {
  const [posts, tags] = await Promise.all([
    getAllTechPosts(),
    getAllTags(),
  ]);

  return <TechArchive posts={posts.map(post => ({
    ...post,
    title: post.title || 'Untitled',
    summary: post.summary || '',
    publishedAt: post.publishedAt || '',
    tags: [...(post.tags || [])],
    githubLink: post.githubLink || undefined,
  }))} tags={tags} />;
}
