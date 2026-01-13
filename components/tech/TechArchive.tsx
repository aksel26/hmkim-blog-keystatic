'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TechPost } from '@/types';
import { formatDate } from '@/lib/utils';

interface TechArchiveProps {
  posts: TechPost[];
  tags: string[];
}

export default function TechArchive({ posts, tags }: TechArchiveProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (selectedTag) {
      return posts.filter((post) => post.tags?.includes(selectedTag));
    }
    return posts;
  }, [selectedTag, posts]);

  return (
    <div className="container mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          Tech <span className="text-electric-blue">Archive</span>
        </h1>
        <p className="text-lg text-foreground/70">
          Explorations in code, architecture, and engineering.
        </p>
      </motion.header>

      {/* Tag Cloud */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Filter by Tag
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedTag === null
                ? 'bg-electric-blue text-white'
                : 'bg-gray-100 text-foreground hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedTag === tag
                  ? 'bg-electric-blue text-white'
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Posts Grid - Masonry Layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {filteredPosts.map((post, index) => (
          <motion.article
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-electric-blue hover:shadow-xl"
          >
            <Link href={`/tech/${post.slug}`} className="block">
              {/* Difficulty Badge */}
              {post.difficulty && (
                <div className="mb-3 inline-block rounded-md bg-electric-blue/10 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-electric-blue">
                  {post.difficulty}
                </div>
              )}

              {/* Title */}
              <h3 className="mb-3 text-xl font-bold leading-tight tracking-tight transition-colors group-hover:text-electric-blue">
                {post.title}
              </h3>

              {/* Summary */}
              <p className="mb-4 line-clamp-3 text-sm text-foreground/70">
                {post.summary}
              </p>

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-foreground/60">
                <time>{formatDate(post.publishedAt)}</time>
                {post.githubLink && (
                  <span className="text-electric-blue">GitHub →</span>
                )}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-foreground/80"
                    >
                      #{tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-foreground/80">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Hover Indicator */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-electric-blue transition-all duration-300 group-hover:w-full" />
            </Link>
          </motion.article>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-lg text-foreground/60">
            No posts found for this tag.
          </p>
        </div>
      )}
    </div>
  );
}
