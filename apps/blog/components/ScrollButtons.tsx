'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Share2, Check, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollButtonsProps {
  showShare?: boolean;
  shareData?: {
    title: string;
    text?: string;
    url?: string;
  };
}

export default function ScrollButtons({ showShare = false, shareData }: ScrollButtonsProps) {
  const [showButtons, setShowButtons] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

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

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (showShareMenu) setShowShareMenu(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showShareMenu]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const url = shareData?.url || window.location.href;
    const title = shareData?.title || document.title;
    const text = shareData?.text || '';

    // Web Share API 지원 확인 (주로 모바일)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // 사용자가 취소한 경우 무시
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // 데스크탑: 공유 메뉴 토글
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const shareToTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = shareData?.url || window.location.href;
    const title = shareData?.title || document.title;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'width=550,height=420'
    );
    setShowShareMenu(false);
  };

  const shareToFacebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = shareData?.url || window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'width=550,height=420'
    );
    setShowShareMenu(false);
  };

  const shareToLinkedIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = shareData?.url || window.location.href;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank',
      'width=550,height=420'
    );
    setShowShareMenu(false);
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 flex flex-col gap-2 z-50 transition-all duration-300 xl:hidden",
        showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      {/* 공유 버튼 */}
      {showShare && (
        <div className="relative">
          <button
            onClick={handleShare}
            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5 text-foreground" />
          </button>

          {/* 데스크탑 공유 메뉴 */}
          {showShareMenu && (
            <div
              className="absolute right-14 bottom-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[160px] animate-in fade-in slide-in-from-right-2 duration-200"
              onClick={(e) => e.stopPropagation()}
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
            </div>
          )}
        </div>
      )}

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
