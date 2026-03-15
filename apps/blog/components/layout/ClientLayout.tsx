'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

import { ThemeProvider } from '@/components/theme-provider';
import { LazyMotion, domAnimation } from 'framer-motion';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { SearchItem } from '@/lib/types';

const SearchDialog = dynamic(
  () => import('@/components/search/SearchDialog').then(mod => mod.SearchDialog),
  { ssr: false }
);

export default function ClientLayout({
  children,
  searchData,
}: {
  children: React.ReactNode;
  searchData: SearchItem[];
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

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
      <LazyMotion features={domAnimation} strict>
        <Header onSearchOpen={() => setSearchOpen(true)} />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} items={searchData} />
      </LazyMotion>
    </ThemeProvider>
  );
}
