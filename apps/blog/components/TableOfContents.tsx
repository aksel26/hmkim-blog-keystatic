'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TocItem } from '@/lib/toc';

interface TableOfContentsProps {
    items: TocItem[];
}

// Shared hook for TOC functionality
function useToc(items: TocItem[]) {
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (items.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-80px 0px -80% 0px',
                threshold: 0,
            }
        );

        items.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [items]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offsetTop = element.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth',
            });
            setActiveId(id);
        }
    }, []);

    return { activeId, handleClick };
}

// Mobile: Collapsible TOC
export function MobileTableOfContents({ items }: TableOfContentsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { activeId, handleClick } = useToc(items);

    if (items.length === 0) return null;

    const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        handleClick(e, id);
        setIsOpen(false);
    };

    const getItemClassName = (item: TocItem) => {
        const levelClass = item.level === 2 ? 'pl-0' : item.level === 3 ? 'pl-4' : 'pl-8';
        const activeClass = activeId === item.id
            ? 'text-electric-blue font-medium'
            : 'text-foreground/60 hover:text-foreground/90';
        return `block py-1.5 text-sm transition-colors ${levelClass} ${activeClass}`;
    };

    return (
        <div className="xl:hidden mb-8">
            <div className="border border-white/20 dark:border-white/10 rounded-lg overflow-hidden backdrop-blur-md bg-white/40 dark:bg-gray-900/40 shadow-lg">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <span>목차</span>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
                <div
                    className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                >
                    <div className="overflow-hidden">
                        <nav className="px-4 py-3 space-y-1 max-h-[60vh] overflow-y-auto">
                            {items.map((item, index) => (
                                <a
                                    key={`${item.id}-${index}`}
                                    href={`#${item.id}`}
                                    onClick={(e) => handleItemClick(e, item.id)}
                                    className={getItemClassName(item)}
                                >
                                    {item.text}
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Desktop: Sticky TOC
export function DesktopTableOfContents({ items }: TableOfContentsProps) {
    const { activeId, handleClick } = useToc(items);

    if (!items || items.length === 0) return null;

    const getItemClassName = (item: TocItem) => {
        const levelClass = item.level === 2 ? 'pl-3' : item.level === 3 ? 'pl-5' : 'pl-7';
        const activeClass = activeId === item.id
            ? 'border-electric-blue text-foreground font-medium'
            : 'border-transparent text-foreground/50 hover:text-foreground/80 hover:border-gray-300 dark:hover:border-gray-600';
        return `block py-1 text-[13px] leading-snug transition-all duration-200 border-l-2 ${levelClass} ${activeClass}`;
    };

    return (
        <aside className="hidden xl:block fixed top-1/2 -translate-y-1/2 right-[calc(40%-580px)] z-10 w-56">
            <nav className="p-4 rounded-xl backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border border-white/20 dark:border-white/10 shadow-lg space-y-1 max-h-[70vh] overflow-y-auto">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-3">
                    목차
                </p>
                {items.map((item, index) => (
                    <a
                        key={`${item.id}-${index}`}
                        href={`#${item.id}`}
                        onClick={(e) => handleClick(e, item.id)}
                        className={getItemClassName(item)}
                    >
                        {item.text}
                    </a>
                ))}
            </nav>
        </aside>
    );
}

// Combined component for backward compatibility
export function TableOfContents({ items }: TableOfContentsProps) {
    return (
        <>
            <MobileTableOfContents items={items} />
            <DesktopTableOfContents items={items} />
        </>
    );
}
