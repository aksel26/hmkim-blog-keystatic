'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

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

  const {
    displayedItems,
    hasMore,
    isLoading,
    loadMoreRef,
    newItemsStartIndex,
  } = useInfiniteScroll(filteredPosts, {
    itemsPerPage: 9,
    threshold: 200,
    loadDelay: 300,
  });

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
        <span className="text-life-orange">Life</span>Logs
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
              ? 'bg-life-orange text-white dark:text-gray-700'
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
                ? 'bg-life-orange text-white dark:text-gray-700'
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
        {displayedItems.map((post, index) => {
          const isNewItem = index >= newItemsStartIndex && newItemsStartIndex > 0;

          return (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: isNewItem ? (index - newItemsStartIndex) * 0.08 : index * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="group relative flex flex-col overflow-hidden rounded-xl"
            >
              <Link href={`/life/${post.slug}`} className="absolute inset-0 z-10" aria-label={`Read ${post.title}`}>
                <span className="sr-only">Read {post.title}</span>
              </Link>

              {/* Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                {post.thumbnailImage ? (
                  <Image
                    src={post.thumbnailImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                  <div className="flex h-full items-center justify-center text-4xl text-gray-400">
                    📷
                  </div>
                )}

                {/* Hashtags Badge */}
                {post.tags && post.tags.length > 0 && (
                  <div className="absolute left-3 top-3 z-[5] flex gap-1 flex-wrap max-w-[80%]">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className="inline-flex items-center rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        +{post.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="pt-4 flex flex-col flex-1">
                <h3 className="text-xl font-medium leading-tight tracking-tight mb-2 transition-colors group-hover:text-life-orange">
                  {post.title}
                </h3>

                <p className="text-foreground/50 text-sm line-clamp-2 mb-3">
                  {post.summary}
                </p>

                <time className="text-xs text-foreground/40 mt-auto">
                  {formatDate(post.createdAt)}
                </time>
              </div>
            </motion.article>
          );
        })}
      </motion.div>

      {/* Load More Trigger */}
      <div
        ref={loadMoreRef}
        className="flex justify-center items-center py-8 mt-8"
      >
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-foreground/50"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading more posts...</span>
          </motion.div>
        )}
        {!hasMore && displayedItems.length > 9 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-foreground/40"
          >
            모든 포스트를 불러왔습니다
          </motion.p>
        )}
      </div>

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
