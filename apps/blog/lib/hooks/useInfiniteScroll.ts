"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  /** 한 번에 로드할 아이템 수 */
  itemsPerPage?: number;
  /** 뷰포트 하단에서 얼마나 떨어졌을 때 로드할지 (px) */
  threshold?: number;
  /** 로드 딜레이 (ms) - 너무 빠른 연속 로드 방지 */
  loadDelay?: number;
}

interface UseInfiniteScrollReturn<T> {
  /** 현재 표시할 아이템들 */
  displayedItems: T[];
  /** 더 로드할 아이템이 있는지 */
  hasMore: boolean;
  /** 로딩 중인지 */
  isLoading: boolean;
  /** 관찰 대상 ref (스크롤 하단에 배치) */
  loadMoreRef: React.RefObject<HTMLDivElement>;
  /** 새로 로드된 아이템의 시작 인덱스 (애니메이션용) */
  newItemsStartIndex: number;
  /** 리셋 함수 (필터 변경 시 사용) */
  reset: () => void;
}

export function useInfiniteScroll<T>(
  items: T[],
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn<T> {
  const { itemsPerPage = 6, threshold = 100, loadDelay = 300 } = options;

  const [displayCount, setDisplayCount] = useState(itemsPerPage);
  const [isLoading, setIsLoading] = useState(false);
  const [newItemsStartIndex, setNewItemsStartIndex] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const displayedItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    setTimeout(() => {
      setNewItemsStartIndex(displayCount);
      setDisplayCount((prev) => Math.min(prev + itemsPerPage, items.length));
      setIsLoading(false);
      isLoadingRef.current = false;
    }, loadDelay);
  }, [displayCount, hasMore, itemsPerPage, items.length, loadDelay]);

  const reset = useCallback(() => {
    setDisplayCount(itemsPerPage);
    setNewItemsStartIndex(0);
    setIsLoading(false);
    isLoadingRef.current = false;
  }, [itemsPerPage]);

  // items가 변경되면 리셋 (필터링 등)
  useEffect(() => {
    reset();
  }, [items, reset]);

  // Intersection Observer 설정
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingRef.current) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore, threshold]);

  return {
    displayedItems,
    hasMore,
    isLoading,
    loadMoreRef: loadMoreRef as React.RefObject<HTMLDivElement>,
    newItemsStartIndex,
    reset,
  };
}
