import type { MetadataRoute } from 'next';
import { getAllTechPosts, getAllLifePosts } from '@/lib/keystatic/reader';

function getLatestModified(posts: Array<{ updatedAt?: string | null; createdAt?: string | null }>) {
  const timestamps = posts
    .map((post) => post.updatedAt || post.createdAt)
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date).getTime())
    .filter((time) => Number.isFinite(time));

  if (timestamps.length === 0) {
    return new Date().toISOString();
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.blog';

  const [techPosts, lifePosts] = await Promise.all([
    getAllTechPosts(),
    getAllLifePosts(),
  ]);

  const latestTechModified = getLatestModified(techPosts);
  const latestLifeModified = getLatestModified(lifePosts);
  const latestSiteModified = getLatestModified([...techPosts, ...lifePosts]);

  const techPostUrls: MetadataRoute.Sitemap = techPosts.map((post) => ({
    url: `${baseUrl}/tech/${post.slug}`,
    lastModified: post.updatedAt || post.createdAt || new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const lifePostUrls: MetadataRoute.Sitemap = lifePosts.map((post) => ({
    url: `${baseUrl}/life/${post.slug}`,
    lastModified: post.updatedAt || post.createdAt || new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: latestSiteModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/tech`,
      lastModified: latestTechModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/life`,
      lastModified: latestLifeModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/me`,
      lastModified: latestSiteModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...techPostUrls,
    ...lifePostUrls,
  ];
}
