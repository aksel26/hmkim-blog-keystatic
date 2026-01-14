'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SearchItem } from '@/lib/types';

interface HeaderProps {
  onSearchOpen: () => void;
}

export default function Header({ onSearchOpen }: HeaderProps) {
  const pathname = usePathname();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSearchOpen();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onSearchOpen]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Tech', href: '/tech' },
    { label: 'Life', href: '/life' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight transition-colors hover:text-electric-blue"
        >
          HM<span className="text-electric-blue">.</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative px-1 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'text-electric-blue'
                  : 'text-foreground/80 hover:text-electric-blue'
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-electric-blue"
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </Link>
          ))}

          {/* Search Trigger */}
          <button
            onClick={() => onSearchOpen()}
            className="flex items-center gap-2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
            <kbd className="hidden pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Link */}
          <Link
            href="/keystatic"
            className="rounded-md bg-electric-blue px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-dark active:scale-95"
          >
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}
