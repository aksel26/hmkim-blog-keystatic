'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

import { ThemeProvider } from '@/components/theme-provider';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show header/footer on Keystatic admin pages
  const isKeystatic = pathname.startsWith('/keystatic') || pathname.startsWith('/api/keystatic');

  if (isKeystatic) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"

    >
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </ThemeProvider>
  );
}
