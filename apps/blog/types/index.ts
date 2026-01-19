// Post Types
export interface Post {
  slug: string;
  title: string;
  summary?: string;
  keywords?: string[];
  category: 'tech' | 'life';
  status: 'draft' | 'published';
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  thumbnailImage?: string;
  thumbnailVideo?: string;
}

// Common Types
export type PostCategory = 'tech' | 'life';
export type PostStatus = 'draft' | 'published';

export interface BlogConfig {
  siteName: string;
  siteUrl: string;
  description: string;
  author: string;
  social?: {
    github?: string;
    twitter?: string;
    email?: string;
  };
}
