interface PersonSchemaProps {
  name?: string;
  description?: string;
  url?: string;
  jobTitle?: string;
  sameAs?: string[];
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.me';

export function PersonSchema({
  name = '김현민',
  description = '직관적이고 빠른 웹 애플리케이션을 만드는 프론트엔드 개발자',
  url = `${baseUrl}/me`,
  jobTitle = '프론트엔드 개발자',
  sameAs = [
    'https://github.com/hmkim',
    'https://linkedin.com/in/hmkim',
  ],
}: PersonSchemaProps = {}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    description,
    url,
    jobTitle,
    sameAs,
    knowsAbout: [
      'Web Development',
      'Frontend Development',
      'React',
      'Next.js',
      'TypeScript',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
