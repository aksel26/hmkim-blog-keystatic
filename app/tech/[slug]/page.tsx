import { getTechPost, getAllTechPosts } from '@/lib/keystatic/reader';
import { MarkdocRenderer } from '@/components/MarkdocRenderer';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import StickySidebar from '@/components/StickySidebar';

export async function generateStaticParams() {
    const posts = await getAllTechPosts();
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

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Sticky Sidebar */}
            <StickySidebar />

            {/* Back Navigation */}
            <div className="container mx-auto px-6 py-8 max-w-[800px]">
                <Link
                    href="/tech"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-electric-blue"
                >
                    ← Back to Tech Archive
                </Link>
            </div>

            {/* Text Hero Section */}
            <div className="container mx-auto px-6 pt-12 pb-16 text-center max-w-4xl">
                <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                    {post.tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-md bg-electric-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-electric-blue"
                        >
                            #{tag}
                        </span>
                    ))}
                    {post.difficulty && (
                        <span className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-semibold capitalize tracking-wider text-foreground">
                            {post.difficulty} Level
                        </span>
                    )}
                </div>

                <h1 className="mb-8 text-3xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-5xl">
                    {post.title}
                </h1>

                <p className="mb-8 text-lg text-foreground/70 md:text-xl max-w-2xl mx-auto">
                    {post.summary}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-foreground/60">
                    <time className="flex items-center gap-2">
                        <span>📅</span>
                        {formatDate(post.publishedAt || '')}
                    </time>
                    {post.githubLink && (
                        <a
                            href={post.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 font-medium text-electric-blue transition-colors hover:text-blue-dark"
                        >
                            <span>💻</span>
                            View on GitHub
                        </a>
                    )}
                </div>
            </div>

            {/* Article Content */}
            <article className="container mx-auto px-6 max-w-[800px]">
                <div className="prose prose-lg prose-gray mx-auto">
                    <MarkdocRenderer node={node} />
                </div>
            </article>

            {/* Navigation */}
            <div className="border-t border-gray-200 bg-white py-12 mt-20">
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
