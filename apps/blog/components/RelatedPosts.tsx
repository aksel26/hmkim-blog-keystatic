import Link from 'next/link';
import Image from 'next/image';
import { formatDate, isGifImage } from '@/lib/utils';

interface RelatedPost {
  slug: string;
  title: string;
  summary: string;
  createdAt: string;
  tags: string[];
  thumbnailImage?: string;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
  category: 'tech' | 'life';
}

export function RelatedPosts({ posts, category }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  const accentHover =
    category === 'tech'
      ? 'group-hover:text-tech-blue'
      : 'group-hover:text-life-orange';

  return (
    <section className="container mx-auto max-w-5xl px-6 mt-20">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-foreground/60">
        관련 글
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post.slug} className="group">
            <Link href={`/${category}/${post.slug}`} className="block">
              {post.thumbnailImage && (
                <div className="relative mb-3 aspect-video overflow-hidden rounded-xl">
                  <Image
                    src={post.thumbnailImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={isGifImage(post.thumbnailImage)}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <h3
                className={`mb-2 text-base font-medium leading-snug tracking-tight transition-colors ${accentHover}`}
              >
                {post.title}
              </h3>
              {post.summary && (
                <p className="mb-2 line-clamp-2 text-sm text-foreground/50">
                  {post.summary}
                </p>
              )}
              <time className="text-xs text-foreground/60">
                {formatDate(post.createdAt)}
              </time>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
