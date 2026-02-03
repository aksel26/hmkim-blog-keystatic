'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Search, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SearchItem } from '@/lib/types';

interface HeaderProps {
  onSearchOpen: () => void;
}

export default function Header({ onSearchOpen }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isProduction = process.env.NODE_ENV === 'production';

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Tech', href: '/tech' },
    { label: 'Life', href: '/life' },
    { label: 'Me', href: '/me' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight transition-colors hover:text-electric-blue z-50"
          onClick={() => setMobileMenuOpen(false)}
        >
          HM<span className="text-electric-blue">.</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
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
            <kbd className="hidden pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70 lg:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Link - only shown in development */}
          {!isProduction && (
            <Link
              href="/keystatic"
              className="rounded-md bg-electric-blue px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-dark active:scale-95"
            >
              Admin
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <button
            onClick={() => onSearchOpen()}
            className="flex items-center gap-2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            className="z-50 p-2 text-foreground/80 hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-16 z-40 bg-background/60 backdrop-blur-xl md:hidden h-screen"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-0 top-16 z-50 flex flex-col bg-background/80 backdrop-blur-lg p-6 md:hidden border-t border-b border-b-gray-100"
            >
              <div className="flex flex-col space-y-4">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'text-lg font-medium transition-colors p-2 rounded-md hover:bg-muted',
                      isActive(item.href)
                        ? 'text-electric-blue bg-muted/50'
                        : 'text-foreground/80'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="pt-4 border-t border-t-gray-300 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>

                {/* Admin Link - only shown in development */}
                {!isProduction && (
                  <div className="pt-2">
                    <Link
                      href="/keystatic"
                      className="block w-full rounded-md bg-electric-blue px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-blue-dark active:scale-95"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
