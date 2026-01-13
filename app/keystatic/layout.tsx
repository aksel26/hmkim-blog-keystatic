import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Keystatic Admin',
  description: 'Content management for Tech & Life Blog',
};

export default function KeystaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
