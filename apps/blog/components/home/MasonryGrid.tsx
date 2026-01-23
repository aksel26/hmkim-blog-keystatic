'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

export interface Post {
    slug: string;
    title: string;
    summary?: string;
    category: 'tech' | 'life';
    tags?: string[] | readonly string[];
    createdAt: string;
    thumbnailImage?: string;
    thumbnailVideo?: string;
}

interface MasonryGridProps {
    posts: Post[];
}

export default function MasonryGrid({ posts }: MasonryGridProps) {
    const {
        displayedItems,
        hasMore,
        isLoading,
        loadMoreRef,
        newItemsStartIndex,
    } = useInfiniteScroll(posts, {
        itemsPerPage: 6,
        threshold: 200,
        loadDelay: 300,
    });

    if (posts.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500">
                No posts found matching your criteria.
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-7xl px-4 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-10 gap-6 auto-rows-fr">
                {displayedItems.map((post, index) => {
                    const row = Math.floor(index / 2);
                    const isEvenRow = row % 2 === 0;
                    const isFirstInRow = index % 2 === 0;
                    const isNewItem = index >= newItemsStartIndex && newItemsStartIndex > 0;

                    let colSpanClass = "";

                    if (isEvenRow) {
                        colSpanClass = isFirstInRow ? "md:col-span-7" : "md:col-span-3";
                    } else {
                        colSpanClass = isFirstInRow ? "md:col-span-3" : "md:col-span-7";
                    }

                    return (
                        <motion.div
                            key={`${post.category}-${post.slug}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: isNewItem ? (index - newItemsStartIndex) * 0.1 : index * 0.05,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            className={cn(
                                "group relative flex flex-col overflow-hidden rounded-xl",
                                colSpanClass
                            )}
                        >
                            <Link href={`/${post.category}/${post.slug}`} className="absolute inset-0 z-10" aria-label={`Read ${post.title}`}>
                                <span className="sr-only">Read {post.title}</span>
                            </Link>

                            {/* Thumbnail with Tag overlay */}
                            <div className="relative h-[360px] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                                {post.thumbnailImage && (
                                    <Image
                                        src={post.thumbnailImage}
                                        alt={post.title}
                                        fill
                                        priority={index < 2}
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                )}

                                {post.thumbnailVideo && !post.thumbnailImage && (
                                    <video
                                        src={post.thumbnailVideo}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        autoPlay
                                        playsInline
                                    />
                                )}

                                {/* Tag on top left */}
                                <div className="absolute left-3 top-3 z-[5]">
                                    <span className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm",
                                        post.category === 'tech'
                                            ? "bg-white/90 text-black"
                                            : "bg-black/80 text-white"
                                    )}>
                                        {post.category.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="pt-4 flex flex-col flex-1">
                                <h3 className="text-xl font-medium leading-tight tracking-tight mb-2 group-hover:underline decoration-1 underline-offset-4">
                                    {post.title}
                                </h3>

                                <p className="text-foreground/50 text-sm line-clamp-2 mb-3">
                                    {post.summary}
                                </p>

                                <time className="text-xs text-foreground/40 mt-auto">
                                    {formatDate(post.createdAt)}
                                </time>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

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
                {!hasMore && displayedItems.length > 6 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-foreground/40"
                    >
                        모든 포스트를 불러왔습니다
                    </motion.p>
                )}
            </div>
        </div>
    );
}
