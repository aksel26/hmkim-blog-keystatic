import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '@/keystatic.config';

// Create a reader instance
// Pass empty string for local storage mode
export const reader = createReader('', keystaticConfig);

// Helper functions for Tech posts
export async function getAllTechPosts() {
  const slugs = await reader.collections.tech.list();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const post = await reader.collections.tech.read(slug);
      // Exclude content function for client component serialization
      const { content, ...postData } = post || {};
      return {
        slug,
        ...postData,
      };
    })
  );
  return posts.sort(
    (a, b) =>
      new Date(b?.publishedAt || '').getTime() -
      new Date(a?.publishedAt || '').getTime()
  );
}

export async function getTechPost(slug: string) {
  return await reader.collections.tech.read(slug);
}

export async function getTechPostsByTag(tag: string) {
  const posts = await getAllTechPosts();
  return posts.filter((post) => post?.tags?.includes(tag));
}

// Helper functions for Life posts
export async function getAllLifePosts() {
  const slugs = await reader.collections.life.list();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const post = await reader.collections.life.read(slug);
      // Exclude content function for client component serialization
      const { content, ...postData } = post || {};
      return {
        slug,
        ...postData,
      };
    })
  );
  return posts.sort(
    (a, b) =>
      new Date(b?.visitDate || '').getTime() -
      new Date(a?.visitDate || '').getTime()
  );
}

export async function getLifePost(slug: string) {
  return await reader.collections.life.read(slug);
}

export async function getLifePostsByCategory(category: string) {
  const posts = await getAllLifePosts();
  return posts.filter((post) => post?.category === category);
}

// Get all unique tags from Tech posts
export async function getAllTags() {
  const posts = await getAllTechPosts();
  const tags = posts.flatMap((post) => post?.tags || []);
  return Array.from(new Set(tags));
}
