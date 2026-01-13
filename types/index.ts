// Tech Collection Types
export interface TechPost {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  githubLink?: string;
  publishedAt: string;
}

// Life Collection Types
export interface LifePost {
  slug: string;
  title: string;
  location?: string;
  visitDate: string;
  rating?: number;
  category: 'restaurant' | 'cafe' | 'travel' | 'concert';
  thumbnail?: string;
  gallery?: string[];
}

// Common Types
export type PostCategory = 'tech' | 'life';

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
