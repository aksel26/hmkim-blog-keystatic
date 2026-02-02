import type { MetadataRoute } from 'next';
import { getAllTechPosts, getAllLifePosts } from '@/lib/keystatic/reader';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.blog';

  const [techPosts, lifePosts] = await Promise.all([
    getAllTechPosts(),
    getAllLifePosts(),
  ]);

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
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/tech`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/life`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/me`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...techPostUrls,
    ...lifePostUrls,
  ];
}
