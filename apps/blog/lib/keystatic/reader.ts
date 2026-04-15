import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '@/keystatic.config';

// Create a reader instance
// Pass empty string for local storage mode
export const reader = createReader('', keystaticConfig);

type TechEntry = NonNullable<Awaited<ReturnType<typeof reader.collections.tech.read>>>;
type LifeEntry = NonNullable<Awaited<ReturnType<typeof reader.collections.life.read>>>;

type TechListItem = Omit<TechEntry, 'content'> & { slug: string };
type LifeListItem = Omit<LifeEntry, 'content'> & { slug: string };

function stripContent<T extends { content?: unknown }>(entry: T): Omit<T, 'content'> {
  const copy = { ...entry };
  delete copy.content;
  return copy;
}

// Helper functions for Tech posts
export async function getAllTechPosts(onlyPublished = true): Promise<TechListItem[]> {
  const slugs = await reader.collections.tech.list();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const post = await reader.collections.tech.read(slug);
      if (!post) return null;
      const postData = stripContent(post);
      return {
        slug,
        ...postData,
      } satisfies TechListItem;
    })
  );
  const existingPosts = posts.filter((post): post is TechListItem => post !== null);

  const filteredPosts = onlyPublished
    ? existingPosts.filter((post) => post.status === 'published')
    : existingPosts;

  return filteredPosts.sort(
    (a, b) =>
      new Date(b?.createdAt || '').getTime() -
      new Date(a?.createdAt || '').getTime()
  );
}

export async function getTechPost(slug: string) {
  return await reader.collections.tech.read(slug);
}

// Helper functions for Life posts
export async function getAllLifePosts(onlyPublished = true): Promise<LifeListItem[]> {
  const slugs = await reader.collections.life.list();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const post = await reader.collections.life.read(slug);
      if (!post) return null;
      const postData = stripContent(post);
      return {
        slug,
        ...postData,
      } satisfies LifeListItem;
    })
  );
  const existingPosts = posts.filter((post): post is LifeListItem => post !== null);

  const filteredPosts = onlyPublished
    ? existingPosts.filter((post) => post.status === 'published')
    : existingPosts;

  return filteredPosts.sort(
    (a, b) =>
      new Date(b?.createdAt || '').getTime() -
      new Date(a?.createdAt || '').getTime()
  );
}

export async function getLifePost(slug: string) {
  return await reader.collections.life.read(slug);
}

// Get all posts from both collections
export async function getAllPosts(onlyPublished = true) {
  const [techPosts, lifePosts] = await Promise.all([
    getAllTechPosts(onlyPublished),
    getAllLifePosts(onlyPublished),
  ]);

  const allPosts = [
    ...techPosts.map((post) => ({ ...post, category: 'tech' as const })),
    ...lifePosts.map((post) => ({ ...post, category: 'life' as const })),
  ];

  return allPosts.sort(
    (a, b) =>
      new Date(b?.createdAt || '').getTime() -
      new Date(a?.createdAt || '').getTime()
  );
}

// Get all unique tags from both collections
export async function getAllTags(onlyPublished = true) {
  const posts = await getAllPosts(onlyPublished);
  const tags = posts.flatMap((post) => post?.tags || []);
  return Array.from(new Set(tags));
}

// Get tags from Tech posts only
export async function getTechTags(onlyPublished = true) {
  const posts = await getAllTechPosts(onlyPublished);
  const tags = posts.flatMap((post) => post?.tags || []);
  return Array.from(new Set(tags));
}

// Get tags from Life posts only
export async function getLifeTags(onlyPublished = true) {
  const posts = await getAllLifePosts(onlyPublished);
  const tags = posts.flatMap((post) => post?.tags || []);
  return Array.from(new Set(tags));
}

// Get all unique keywords from both collections
export async function getAllKeywords(onlyPublished = true) {
  const posts = await getAllPosts(onlyPublished);
  const keywords = posts.flatMap((post) => post?.keywords || []);
  return Array.from(new Set(keywords));
}
