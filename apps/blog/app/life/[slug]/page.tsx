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
import { NewsletterCTA } from '@/components/NewsletterCTA';
import { ViewCounter } from '@/components/views/ViewCounter';
import { CommentSection } from '@/components/comments';

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
            <StickySidebar
                shareData={{
                    title: post.title,
                    text: post.summary || '',
                }}
            />

            {/* Table of Contents (Desktop - fixed position) */}
            <DesktopTableOfContents items={tocItems} />

            {/* Scroll Buttons with Share */}
            <ScrollButtons
                showShare={true}
                shareData={{
                    title: post.title,
                    text: post.summary || '',
                }}
            />

            {/* Back Navigation */}
            <div className="container mx-auto px-6 py-8 max-w-6xl">
                <Link
                    href="/life"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-life-orange"
                >
                    ← Back to Life Logs
                </Link>
            </div>

            {/* Text Hero Section */}
            <div className="container mx-auto px-6 pt-12 pb-16 text-center max-w-6xl">
                <h1 className="mb-12 text-3xl font-light leading-tight tracking-tight md:text-5xl lg:text-5xl">
                    {post.title}
                </h1>

                {post.summary && (
                    <p className="mb-8 text-base text-foreground/45 md:text-lg max-w-3xl mx-auto">
                        {post.summary}
                    </p>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-md bg-transparent px-3 py-1 text-xs font-light tracking-wider dark:text-white text-life-orange border border-life-orange/60 dark:border-gray-400 "
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* 작성일 & 조회수 */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-foreground/60 dark:text-foreground/50">
                    <time className="flex items-center gap-2">
                        {formatDate(post.createdAt || '')}
                    </time>
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <time className="flex items-center gap-2">
                            <span>✏️</span>
                            수정: {formatDate(post.updatedAt)}
                        </time>
                    )}
                    <ViewCounter category="life" slug={params.slug} />
                    {post.status === 'draft' && (
                        <span className="flex items-center gap-2 text-yellow-600">
                            <span>📝</span>
                            초안
                        </span>
                    )}
                </div>

            </div>

            {/* Thumbnail Image */}
            {post.thumbnailImage && (
                <div className="container mx-auto px-6 max-w-4xl mb-12">
                    <div className="relative aspect-video overflow-hidden rounded-xl">
                        <Image
                            src={post.thumbnailImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>
            )}

            {/* Thumbnail Video */}
            {post.thumbnailVideo && (
                <div className="container mx-auto px-6 max-w-4xl mb-12">
                    <video
                        src={post.thumbnailVideo}
                        className="w-full rounded-xl"
                        autoPlay
                        muted
                        loop
                        playsInline
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

            {/* Comment Section */}
            <div className="container mx-auto max-w-3xl px-6 mt-8">
                <CommentSection category="life" slug={params.slug} />
            </div>

            {/* Newsletter CTA */}
            <div className="container mx-auto max-w-3xl px-6 mt-16">
                <NewsletterCTA />
            </div>

            {/* Navigation */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-background py-12 mt-16">
                <div className="container mx-auto max-w-5xl px-6 text-center">
                    <Link
                        href="/life"
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition-all hover:bg-orange-600 active:scale-95"
                    >
                        ← 뒤로가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
