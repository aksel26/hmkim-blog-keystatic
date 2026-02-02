import ClientLayout from "@/components/layout/ClientLayout";
import { getAllPosts } from "@/lib/keystatic/reader";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const freesentation = localFont({
  src: "./fonts/FreesentationVF.ttf",
  display: "swap",
});


const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.blog';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "HM Blog - Tech & Life",
  description: "This is where I tell stories. Most of them are about tech and life.",
  openGraph: {
    siteName: 'HM Blog',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    google: 'WLtng7drBjngQJuK1_XMImmpRYlaQJAg6yAS5YyDypU',
    other: {
      'naver-site-verification': 'f59e7167253f0498510db1f6e96d4f79a12491a1',
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posts = await getAllPosts();
  const searchData = posts.map((post) => ({
    title: post.title,
    slug: `/${post.category}/${post.slug}`,
    category: post.category,
  }));

  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${freesentation.className} antialiased`}
      >
        <ClientLayout searchData={searchData}>{children}</ClientLayout>
      </body>
    </html>
  );
}
