'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScrollButtons() {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowButtons(window.scrollY > 200);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 flex flex-col gap-2 z-50 transition-all duration-300",
        showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <button
        onClick={scrollToTop}
        className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5 text-foreground" />
      </button>
      <button
        onClick={scrollToBottom}
        className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        aria-label="Scroll to bottom"
      >
        <ChevronDown className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
}
