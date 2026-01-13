import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Explore',
      links: [
        { label: 'Tech Blog', href: '/tech' },
        { label: 'Life Blog', href: '/life' },
      ],
    },
    {
      title: 'Connect',
      links: [
        { label: 'GitHub', href: 'https://github.com' },
        { label: 'LinkedIn', href: 'https://linkedin.com' },
        { label: 'Twitter', href: 'https://twitter.com' },
      ],
    },
  ];

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block text-2xl font-bold tracking-tight"
            >
              HM<span className="text-electric-blue">.</span>
            </Link>
            <p className="text-sm text-foreground/70">
              This is where I tell stories. Most of them are about tech and
              life.
            </p>
          </div>

          {/* Links Sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-electric-blue"
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={
                        link.href.startsWith('http')
                          ? 'noopener noreferrer'
                          : undefined
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-foreground/60">
            &copy; {currentYear} HM Blog. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
