import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '@/keystatic.config';

// Create a reader instance
// Pass empty string for local storage mode
export const reader = createReader('', keystaticConfig);

// Helper functions for Tech posts
export async function getAllTechPosts(onlyPublished = true) {
  const slugs = await reader.collections.tech.list();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const post = await reader.collections.tech.read(slug);
      const { content, ...postData } = post || {};
      return {
        slug,
        ...postData,
      };
    })
  );

  const filteredPosts = onlyPublished
    ? posts.filter((post) => post?.status === 'published')
    : posts;

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
export async function getAllLifePosts(onlyPublished = true) {
  const slugs = await reader.collections.life.list();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const post = await reader.collections.life.read(slug);
      const { content, ...postData } = post || {};
      return {
        slug,
        ...postData,
      };
    })
  );

  const filteredPosts = onlyPublished
    ? posts.filter((post) => post?.status === 'published')
    : posts;

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
