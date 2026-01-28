"use client";

import { useEffect, useState, useRef } from "react";
import { Eye } from "lucide-react";

interface ViewCounterProps {
  category: "tech" | "life";
  slug: string;
  className?: string;
  showIcon?: boolean;
  incrementOnMount?: boolean;
}

// 방문자 ID를 localStorage에서 관리
function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";

  const key = "blog_visitor_id";
  let visitorId = localStorage.getItem(key);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(key, visitorId);
  }

  return visitorId;
}

export function ViewCounter({
  category,
  slug,
  className = "",
  showIcon = true,
  incrementOnMount = true,
}: ViewCounterProps) {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasIncremented = useRef(false);

  useEffect(() => {
    // Strict Mode에서 두 번 호출 방지
    if (hasIncremented.current && incrementOnMount) {
      return;
    }

    const fetchAndIncrement = async () => {
      try {
        if (incrementOnMount) {
          hasIncremented.current = true;
          // 조회수 증가
          const visitorId = getOrCreateVisitorId();
          const response = await fetch("/api/views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category, slug, visitorId }),
          });

          if (response.ok) {
            const data = await response.json();
            setViewCount(data.view_count);
          }
        } else {
          // 조회만
          const response = await fetch(
            `/api/views?category=${category}&slug=${slug}`
          );

          if (response.ok) {
            const data = await response.json();
            setViewCount(data.view_count);
          }
        }
      } catch (error) {
        console.error("Failed to fetch view count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndIncrement();
  }, [category, slug, incrementOnMount]);

  // 숫자 포맷팅 (1000 -> 1K)
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <span className={`inline-flex items-center gap-1 text-gray-400 ${className}`}>
        {showIcon && <Eye className="w-4 h-4" />}
        <span className="animate-pulse">--</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-gray-500 ${className}`}>
      {showIcon && <Eye className="w-4 h-4" />}
      <span>{viewCount !== null ? formatCount(viewCount) : "0"}</span>
    </span>
  );
}

// 서버 컴포넌트용: 조회수만 표시 (증가 없음)
export function ViewCounterStatic({
  viewCount,
  className = "",
  showIcon = true,
}: {
  viewCount: number;
  className?: string;
  showIcon?: boolean;
}) {
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  return (
    <span className={`inline-flex items-center gap-1 text-gray-500 ${className}`}>
      {showIcon && <Eye className="w-4 h-4" />}
      <span>{formatCount(viewCount)}</span>
    </span>
  );
}
