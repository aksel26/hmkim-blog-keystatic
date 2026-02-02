interface WebSiteSchemaProps {
  name?: string;
  description?: string;
  url?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.blog';

export function WebSiteSchema({
  name = 'HM Blog',
  description = 'Tech & Life stories by 김현민',
  url = baseUrl,
}: WebSiteSchemaProps = {}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url,
    inLanguage: 'ko-KR',
    author: {
      '@type': 'Person',
      name: '김현민',
      url: `${baseUrl}/me`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
