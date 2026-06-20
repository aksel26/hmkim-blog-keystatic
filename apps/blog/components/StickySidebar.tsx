'use client';

import { useState, useEffect, useRef } from 'react';
import { Share2, Heart, MessageCircle, Check, Link2 } from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';

interface StickySidebarProps {
    shareData?: {
        title: string;
        text?: string;
        url?: string;
    };
    category?: 'tech' | 'life';
    slug?: string;
}

function getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') return '';

    const key = 'blog_visitor_id';
    let visitorId = localStorage.getItem(key);

    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(key, visitorId);
    }

    return visitorId;
}

function formatLikeCount(count: number): string {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
}

export default function StickySidebar({ shareData, category, slug }: StickySidebarProps) {
    const [copied, setCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);

    const [likeCount, setLikeCount] = useState<number | null>(null);
    const [liked, setLiked] = useState(false);
    const [likeAnimKey, setLikeAnimKey] = useState(0);
    const isTogglingRef = useRef(false);
    const canLike = Boolean(category && slug);

    // 외부 클릭 시 메뉴 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setShowShareMenu(false);
            }
        };

        if (showShareMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showShareMenu]);

    // 좋아요 상태 초기 조회
    useEffect(() => {
        if (!canLike) return;

        let cancelled = false;
        const fetchLike = async () => {
            try {
                const visitorId = getOrCreateVisitorId();
                const params = new URLSearchParams({
                    category: category!,
                    slug: slug!,
                });
                if (visitorId) params.set('visitorId', visitorId);

                const response = await fetch(`/api/likes?${params.toString()}`);
                if (!response.ok || cancelled) return;

                const data = await response.json();
                setLikeCount(data.like_count ?? 0);
                setLiked(Boolean(data.liked));
            } catch (error) {
                console.error('Failed to fetch like:', error);
            }
        };

        fetchLike();
        return () => {
            cancelled = true;
        };
    }, [canLike, category, slug]);

    const handleLikeToggle = async () => {
        if (!canLike || isTogglingRef.current) return;
        isTogglingRef.current = true;

        const visitorId = getOrCreateVisitorId();
        if (!visitorId) {
            isTogglingRef.current = false;
            return;
        }

        const previousLiked = liked;
        const previousCount = likeCount ?? 0;
        const optimisticLiked = !previousLiked;
        const optimisticCount = Math.max(previousCount + (optimisticLiked ? 1 : -1), 0);

        setLiked(optimisticLiked);
        setLikeCount(optimisticCount);
        if (optimisticLiked) setLikeAnimKey((k) => k + 1);

        try {
            const response = await fetch('/api/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, slug, visitorId }),
            });

            if (!response.ok) throw new Error('Failed to toggle like');

            const data = await response.json();
            setLikeCount(data.like_count ?? 0);
            setLiked(Boolean(data.liked));
        } catch (error) {
            console.error('Failed to toggle like:', error);
            setLiked(previousLiked);
            setLikeCount(previousCount);
        } finally {
            isTogglingRef.current = false;
        }
    };

    const handleShare = () => {
        setShowShareMenu(!showShareMenu);
    };

    const copyToClipboard = async () => {
        const url = shareData?.url || window.location.href;

        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
                setShowShareMenu(false);
            }, 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const shareToTwitter = () => {
        const url = shareData?.url || window.location.href;
        const title = shareData?.title || document.title;
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
            '_blank',
            'width=550,height=420'
        );
        setShowShareMenu(false);
    };

    const shareToFacebook = () => {
        const url = shareData?.url || window.location.href;
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            '_blank',
            'width=550,height=420'
        );
        setShowShareMenu(false);
    };

    const shareToLinkedIn = () => {
        const url = shareData?.url || window.location.href;
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            '_blank',
            'width=550,height=420'
        );
        setShowShareMenu(false);
    };

    const scrollToComments = () => {
        const commentSection = document.querySelector('[data-comment-section]');
        if (commentSection) {
            commentSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="hidden ml-[-100px] xl:block fixed top-1/2 -translate-y-1/2 left-[calc(50%-560px)] z-10 w-12">
            <div className="flex flex-col items-center gap-6">
                {/* Share Button */}
                <div className="relative" ref={shareMenuRef}>
                    <m.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShare}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                        <Share2 className="h-5 w-5" />
                    </m.button>

                    {/* Share Menu */}
                    <AnimatePresence>
                        {showShareMenu && (
                            <m.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="absolute left-14 top-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[160px]"
                            >
                                <button
                                    onClick={copyToClipboard}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span className="text-green-500">복사됨!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Link2 className="w-4 h-4 text-gray-500" />
                                            <span>링크 복사</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={shareToTwitter}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                    <span>X (Twitter)</span>
                                </button>
                                <button
                                    onClick={shareToFacebook}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                >
                                    <svg className="w-4 h-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    <span>Facebook</span>
                                </button>
                                <button
                                    onClick={shareToLinkedIn}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                >
                                    <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                    <span>LinkedIn</span>
                                </button>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Like Button */}
                <div className="flex flex-col items-center gap-1">
                    <m.button
                        whileHover={canLike ? { scale: 1.1 } : undefined}
                        whileTap={canLike ? { scale: 0.95 } : undefined}
                        onClick={handleLikeToggle}
                        disabled={!canLike}
                        aria-label={liked ? '좋아요 취소' : '좋아요'}
                        aria-pressed={liked}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                            liked
                                ? 'bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:hover:bg-pink-900/50'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                        } ${!canLike ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                        <m.span
                            key={likeAnimKey}
                            initial={liked ? { scale: 0.6 } : false}
                            animate={liked ? { scale: [0.6, 1.25, 1] } : { scale: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="flex"
                        >
                            <Heart
                                className="h-5 w-5"
                                fill={liked ? 'currentColor' : 'none'}
                                strokeWidth={liked ? 0 : 2}
                            />
                        </m.span>
                    </m.button>
                    {canLike && likeCount !== null && likeCount > 0 && (
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                            {formatLikeCount(likeCount)}
                        </span>
                    )}
                </div>

                {/* Comment Button */}
                <m.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={scrollToComments}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                >
                    <MessageCircle className="h-5 w-5" />
                </m.button>
            </div>
        </div>
    );
}
