"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Eye } from "lucide-react";

function useCountUp(target: number, duration = 1500) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) return;

    const startTime = performance.now();

    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setCurrent(Math.floor(easedProgress * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

export function TotalViewCounter() {
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [todayViews, setTodayViews] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const animatedTotal = useCountUp(totalViews ?? 0);
  const animatedToday = useCountUp(todayViews ?? 0);

  const fetchTotal = useCallback(async () => {
    try {
      const response = await fetch("/api/views/total");
      if (response.ok) {
        const data = await response.json();
        setTotalViews(data.total_views);
        setTodayViews(data.today_views);
      }
    } catch (error) {
      console.error("Failed to fetch total views:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTotal();
  }, [fetchTotal]);

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-gray-400">
        <Eye className="w-4 h-4" />
        <span className="animate-pulse">총 -- · 오늘 --</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
      <Eye className="w-4 h-4" />
      <span>
        총 {animatedTotal.toLocaleString()} · 오늘{" "}
        {animatedToday.toLocaleString()}
      </span>
    </span>
  );
}
