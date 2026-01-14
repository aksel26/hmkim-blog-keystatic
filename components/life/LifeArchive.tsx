'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils';

interface LifePost {
  slug: string;
  title: string;
  summary?: string;
  createdAt: string;
  tags?: string[];
  thumbnailImage?: string;
  thumbnailVideo?: string;
}

interface LifeArchiveProps {
  posts: LifePost[];
  tags: string[];
}

export default function LifeArchive({ posts, tags }: LifeArchiveProps) {
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
          Life <span className="text-orange-500">Logs</span>
        </h1>
        <p className="text-lg text-foreground/70">
          Captured moments from my journey.
        </p>
      </motion.header>

      {/* Tag Filters */}
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
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedTag === null
              ? 'bg-orange-500 text-white dark:text-gray-700'
              : 'bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedTag === tag
                ? 'bg-orange-500 text-white dark:text-gray-700'
                : 'bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Posts Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filteredPosts.map((post, index) => (
          <motion.article
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900"
          >
            <Link href={`/life/${post.slug}`} className="block">
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-gray-800">
                {post.thumbnailImage ? (
                  <Image
                    src={post.thumbnailImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : post.thumbnailVideo ? (
                  <video
                    src={post.thumbnailVideo}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl">
                    📷
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 transition-opacity duration-500 group-hover:opacity-80" />

                {/* Life Badge */}
                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-900 backdrop-blur-sm">
                    Life
                  </span>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="mb-1 text-xl font-medium leading-tight transition-transform duration-300 group-hover:translate-y-[-4px]">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="text-sm text-white/90 line-clamp-2">{post.summary}</p>
                  )}
                </div>
              </div>

              {/* Meta Info */}
              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-foreground/60">
                  <time>{formatDate(post.createdAt)}</time>
                  <span className="font-medium text-orange-500">Read More →</span>
                </div>
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs text-orange-600 dark:text-orange-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
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
