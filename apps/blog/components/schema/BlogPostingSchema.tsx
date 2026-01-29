interface BlogPostingSchemaProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string | null;
  author?: string;
  tags?: readonly string[];
  thumbnailImage?: string | null;
  category: 'tech' | 'life';
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.me';

export function BlogPostingSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  author = '김현민',
  tags = [],
  thumbnailImage,
  category,
}: BlogPostingSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author,
      url: `${baseUrl}/me`,
    },
    publisher: {
      '@type': 'Person',
      name: author,
      url: `${baseUrl}/me`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    inLanguage: 'ko-KR',
    keywords: tags.join(', '),
    articleSection: category === 'tech' ? 'Technology' : 'Lifestyle',
    ...(thumbnailImage && {
      image: {
        '@type': 'ImageObject',
        url: thumbnailImage.startsWith('http') ? thumbnailImage : `${baseUrl}${thumbnailImage}`,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
