'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { LifePost } from '@/types';
import { formatDate } from '@/lib/utils';

const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { value: 'cafe', label: 'Cafe', emoji: '☕' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'concert', label: 'Concert', emoji: '🎵' },
];

interface LifeArchiveProps {
  posts: LifePost[];
}

export default function LifeArchive({ posts }: LifeArchiveProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (selectedCategory) {
      return posts.filter((post) => post.category === selectedCategory);
    }
    return posts;
  }, [selectedCategory, posts]);

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

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Filter by Category
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-foreground hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === category.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Posts Grid - Image-Centric Layout */}
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
            className="group relative overflow-hidden rounded-xl bg-gray-50"
          >
            <Link href={`/life/${post.slug}`} className="block">
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                {post.thumbnail ? (
                  <Image
                    src={post.thumbnail}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl">
                    {CATEGORIES.find((c) => c.value === post.category)?.emoji || '📷'}
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 transition-opacity duration-500 group-hover:opacity-80" />

                {/* Category Badge */}
                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-900 backdrop-blur-sm">
                    {post.category}
                  </span>
                </div>

                {/* Rating */}
                {post.rating && (
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 backdrop-blur-sm">
                    <span className="text-sm">⭐</span>
                    <span className="text-xs font-bold text-gray-900">
                      {post.rating}
                    </span>
                  </div>
                )}

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="mb-1 text-xl font-bold leading-tight transition-transform duration-300 group-hover:translate-y-[-4px]">
                    {post.title}
                  </h3>
                  {post.location && (
                    <p className="text-sm text-white/90">📍 {post.location}</p>
                  )}
                </div>
              </div>

              {/* Meta Info */}
              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-foreground/60">
                  <time>{formatDate(post.visitDate)}</time>
                  <span className="font-medium text-orange-500">Read More →</span>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-lg text-foreground/60">
            No posts found for this category.
          </p>
        </div>
      )}
    </div>
  );
}
