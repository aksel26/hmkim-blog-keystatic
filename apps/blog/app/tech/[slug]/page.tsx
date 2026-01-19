import { getTechPost, getAllTechPosts } from '@/lib/keystatic/reader';
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
    const posts = await getAllTechPosts(false);
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function TechPostPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const post = await getTechPost(params.slug);

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
            <div className="container mx-auto px-6 py-8 max-w-6xl">
                <Link
                    href="/tech"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-tech-blue"
                >
                    ← Back to Tech Archive
                </Link>
            </div>

            {/* Text Hero Section */}
            <div className="container mx-auto px-6 pt-12 pb-16 text-center max-w-6xl">
            

                <h1 className="mb-12 text-3xl font-light leading-tight tracking-tight md:text-5xl lg:text-5xl">
                    {post.title}
                </h1>

                <p className="mb-8 text-base text-foreground/45 md:text-lg max-w-3xl mx-auto">
                    {post.summary}
                </p>

              
    <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                    {post.tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-md bg-transparent dark:bg-tech-blue/10 px-3 py-1 text-xs font-light tracking-wider text-tech-blue border border-tech-blue/60 dark:border-gray-400 dark:text-gray-100"
                        >
                            {tag}
                        </span>
                    ))}
                    {post.status === 'draft' && (
                        <span className="rounded-md border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                            초안
                        </span>
                    )}
                </div>
              
            </div>

            {/* Thumbnail */}
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

            {/* Article Content */}
            <article className="container mx-auto px-3 max-w-[800px]">
                {/* Table of Contents (Mobile - collapsible) */}
                <MobileTableOfContents items={tocItems} />

                <div className="prose prose-2xl prose-gray dark:prose-invert mx-auto">
                    <MarkdocRenderer node={node} />
                </div>
            </article>
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
                </div>
            {/* Navigation */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-background py-12 mt-20">
                <div className="container mx-auto max-w-5xl px-6 text-center">
                    <Link
                        href="/tech"
                        className="inline-flex items-center gap-2 rounded-lg bg-electric-blue px-6 py-3 font-medium text-white transition-all hover:bg-blue-dark active:scale-95"
                    >
                        ← Browse More Tech Articles
                    </Link>
                </div>
            </div>
        </div>
    );
}
