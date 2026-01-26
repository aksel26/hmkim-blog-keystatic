'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

interface TechPost {
  slug: string;
  title: string;
  summary?: string;
  createdAt: string;
  tags?: string[];
  thumbnailImage?: string;
}

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
        <span className="text-tech-blue">Tech</span> Archive
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
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedTag === null
              ? 'bg-tech-blue text-white dark:text-gray-700'
              : 'bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedTag === tag
                ? 'bg-tech-blue text-white dark:text-gray-700'
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
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 gap-y-12"
      >
        {displayedItems.map((post, index) => {
          const isNewItem = index >= newItemsStartIndex;
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
              className="group relative overflow-hidden dark:border-gray-800 bg-transparent transition-all"
            >
              <Link href={`/tech/${post.slug}`} className="block">
                {/* Thumbnail */}
                {post.thumbnailImage && (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <Image
                      src={post.thumbnailImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="pt-4 flex flex-col flex-1">
                  {/* Title */}
                  <h3 className="mb-3 text-xl font-medium leading-tight tracking-tight transition-colors group-hover:text-tech-blue">
                    {post.title}
                  </h3>

                  {/* Summary */}
                  <p className="mb-4 line-clamp-3 text-sm text-foreground/50">
                    {post.summary}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <time>{formatDate(post.createdAt)}</time>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-foreground/80"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-foreground/80">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                </div>
              </Link>
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
