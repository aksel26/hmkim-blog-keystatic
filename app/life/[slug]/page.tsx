import { getLifePost, getAllLifePosts } from '@/lib/keystatic/reader';
import { MarkdocRenderer } from '@/components/MarkdocRenderer';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import StickySidebar from '@/components/StickySidebar';
import ScrollButtons from '@/components/ScrollButtons';
import { MobileTableOfContents, DesktopTableOfContents } from '@/components/TableOfContents';
import { extractTocFromMarkdoc } from '@/lib/toc';

export async function generateStaticParams() {
    const posts = await getAllLifePosts(false);
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function LifePostPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const post = await getLifePost(params.slug);

    if (!post) {
        notFound();
    }

    const { node } = await post.content();
    const tocItems = extractTocFromMarkdoc(node);

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Sticky Sidebar */}
            <StickySidebar />

            {/* Table of Contents (Desktop - fixed position) */}
            <DesktopTableOfContents items={tocItems} />

            {/* Scroll Buttons */}
            <ScrollButtons />

            {/* Back Navigation */}
            <div className="container mx-auto px-6 py-8 max-w-[800px]">
                <Link
                    href="/life"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
                >
                    ← Back to Life Logs
                </Link>
            </div>

            {/* Text Hero Section */}
            <div className="container mx-auto px-6 pt-12 pb-16 text-center max-w-4xl">
                <span className="mb-6 inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground/80 dark:text-foreground/90">
                    Life
                </span>
                <h1 className="mb-8 text-3xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-5xl">
                    {post.title}
                </h1>

                {post.summary && (
                    <p className="mb-8 text-lg text-foreground/70 md:text-xl max-w-2xl mx-auto">
                        {post.summary}
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-foreground/60 dark:text-foreground/50">
                    <time className="flex items-center gap-2">
                        <span>📅</span>
                        등록: {formatDate(post.createdAt || '')}
                    </time>
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <time className="flex items-center gap-2">
                            <span>✏️</span>
                            수정: {formatDate(post.updatedAt)}
                        </time>
                    )}
                    {post.status === 'draft' && (
                        <span className="flex items-center gap-2 text-yellow-600">
                            <span>📝</span>
                            초안
                        </span>
                    )}
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-md bg-orange-100 dark:bg-orange-900/30 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Keywords */}
                {post.keywords && post.keywords.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {post.keywords.map((keyword) => (
                            <span
                                key={keyword}
                                className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-foreground/70"
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnail Image */}
            {post.thumbnailImage && (
                <div className="relative w-full aspect-[21/9] mb-20">
                    <Image
                        src={post.thumbnailImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            )}

            {/* Thumbnail Video */}
            {post.thumbnailVideo && (
                <div className="container mx-auto px-6 max-w-4xl mb-12">
                    <video
                        src={post.thumbnailVideo}
                        className="w-full rounded-xl"
                        controls
                        autoPlay
                        muted
                        loop
                    />
                </div>
            )}

            {/* Content Section */}
            <article className="container mx-auto px-3 max-w-[800px]">
                {/* Table of Contents (Mobile - collapsible) */}
                <MobileTableOfContents items={tocItems} />

                <div className="prose prose-lg prose-gray dark:prose-invert mx-auto">
                    <MarkdocRenderer node={node} />
                </div>
            </article>

            {/* Navigation */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-background py-12 mt-20">
                <div className="container mx-auto max-w-5xl px-6 text-center">
                    <Link
                        href="/life"
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition-all hover:bg-orange-600 active:scale-95"
                    >
                        ← Browse More Life Posts
                    </Link>
                </div>
            </div>
        </div>
    );
}
