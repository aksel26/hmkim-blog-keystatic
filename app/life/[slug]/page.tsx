import { getLifePost, getAllLifePosts } from '@/lib/keystatic/reader';
import { MarkdocRenderer } from '@/components/MarkdocRenderer';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import StickySidebar from '@/components/StickySidebar';

export async function generateStaticParams() {
    const posts = await getAllLifePosts();
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

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Sticky Sidebar */}
            <StickySidebar />

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
                <span className="mb-6 inline-block rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground/80">
                    {post.category}
                </span>
                <h1 className="mb-8 text-3xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-5xl">
                    {post.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-foreground/60">
                    {post.location && (
                        <span className="flex items-center gap-2">
                            <span>📍</span>
                            {post.location}
                        </span>
                    )}
                    <span className="flex items-center gap-2">
                        <span>📅</span>
                        {formatDate(post.visitDate || '')}
                    </span>
                    {post.rating && (
                        <span className="flex items-center gap-2">
                            <span>⭐</span>
                            {post.rating} / 5
                        </span>
                    )}
                </div>
            </div>

            {/* Full Width Hero Image */}
            {post.thumbnail && (
                <div className="relative w-full aspect-[21/9] mb-20">
                    <Image
                        src={post.thumbnail}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            )}

            {/* Content Section */}
            <article className="container mx-auto px-6 max-w-[800px]">
                <div className="prose prose-lg prose-gray mx-auto">
                    <MarkdocRenderer node={node} />
                </div>
            </article>

            {/* Gallery Section */}
            {post.gallery && post.gallery.length > 0 && (
                <div className="container mx-auto px-6 max-w-7xl mt-24">
                    <h2 className="text-3xl font-bold mb-12 text-center">Gallery</h2>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {post.gallery
                            .filter((item): item is string => typeof item === 'string')
                            .map((img, idx) => (
                                <div key={idx} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                                    <Image
                                        src={img}
                                        alt={`${post.title} gallery image ${idx + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
