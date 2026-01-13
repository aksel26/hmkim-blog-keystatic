import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

export interface Post {
    slug: string;
    title: string;
    summary?: string;
    publishedAt?: string;
    visitDate?: string;
    type: 'tech' | 'life';
    tags?: string[] | readonly string[];
    category?: string;
    coverImage?: string; // Optional cover image path if available
}

interface MasonryGridProps {
    posts: Post[];
}

export default function MasonryGrid({ posts }: MasonryGridProps) {
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
                {posts.map((post, index) => {
                    // Determine layout pattern
                    // Post index 0, 1 -> Row 1 (7:3)
                    // Post index 2, 3 -> Row 2 (3:7)
                    // Post index 4, 5 -> Row 3 (7:3)
                    // ... and so on.

                    const row = Math.floor(index / 2);
                    const isEvenRow = row % 2 === 0; // Row 0, 2, 4... (7:3)
                    const isFirstInRow = index % 2 === 0; // 0, 2, 4...

                    let colSpanClass = "";

                    if (isEvenRow) {
                        // Row 0, 2... -> 7:3
                        colSpanClass = isFirstInRow ? "md:col-span-7" : "md:col-span-3";
                    } else {
                        // Row 1, 3... -> 3:7
                        colSpanClass = isFirstInRow ? "md:col-span-3" : "md:col-span-7";
                    }

                    return (
                        <motion.div
                            key={`${post.type}-${post.slug}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={cn(
                                "group relative flex flex-col justify-between overflow-hidden rounded-xl bg-gray-50 p-6 transition-all hover:bg-gray-100 dark:bg-gray-900/50 dark:hover:bg-gray-800",
                                colSpanClass
                            )}
                        >
                            <Link href={`/${post.type}/${post.slug}`} className="absolute inset-0 z-10" aria-label={`Read ${post.title}`}>
                                <span className="sr-only">Read {post.title}</span>
                            </Link>

                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                                        post.type === 'tech'
                                            ? "bg-white text-black border-gray-200 dark:bg-black dark:text-white dark:border-gray-700"
                                            : "bg-black text-white border-transparent dark:bg-white dark:text-black"
                                    )}>
                                        {post.type.toUpperCase()}
                                    </span>
                                    <ArrowUpRight className="w-5 h-5 opacity-0 -translate-y-1 translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
                                </div>

                                <h3 className="text-2xl font-bold leading-tight tracking-tight mb-3 group-hover:underline decoration-2 underline-offset-4">
                                    {post.title}
                                </h3>

                                <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                                    {post.summary || `A ${post.category || 'post'} about ${post.title}`}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
                                <time>
                                    {formatDate(post.publishedAt || post.visitDate || '')}
                                </time>
                                {(post.tags || post.category) && (
                                    <>
                                        <span>•</span>
                                        <span className="truncate">
                                            {post.category || post.tags?.[0]}
                                        </span>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
