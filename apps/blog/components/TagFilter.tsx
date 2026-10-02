'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countTags, tagKey } from '@/lib/tags';

interface TagFilterProps {
  posts: { tags?: string[] }[];
  selectedKey: string | null;
  onChange: (key: string | null) => void;
  /** 선택된 칩의 배경색 클래스 */
  accentClass: string;
}

// useSearchParams는 정적 페이지에서 Suspense가 필요하다.
// 글 목록까지 CSR로 빠지지 않도록 URL을 읽는 부분만 따로 둔다.
function TagParamSync({ onChange }: Pick<TagFilterProps, 'onChange'>) {
  const tag = useSearchParams().get('tag');

  useEffect(() => {
    onChange(tag ? tagKey(tag) : null);
  }, [tag, onChange]);

  return null;
}

// pushState는 Next.js Router와 통합돼 useSearchParams가 따라온다.
const selectTag = (label: string | null) =>
  window.history.pushState(
    null,
    '',
    label ? `?tag=${encodeURIComponent(label)}` : window.location.pathname
  );

const chipClass =
  'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ring-transparent transition-all';
const idleClass = 'bg-gray-100 dark:bg-gray-800 text-foreground hover:ring-foreground/40';

export default function TagFilter({ posts, selectedKey, onChange, accentClass }: TagFilterProps) {
  // 글 1개짜리 태그는 숨긴다. URL로 직접 선택된 태그는 보여 준다.
  const tags = useMemo(
    () => countTags(posts).filter((tag) => tag.count >= 2 || tag.key === selectedKey),
    [posts, selectedKey]
  );
  const selectedClass = cn(accentClass, 'text-white');

  return (
    <div className="flex flex-wrap gap-2">
      <Suspense fallback={null}>
        <TagParamSync onChange={onChange} />
      </Suspense>
      <button
        onClick={() => selectTag(null)}
        aria-pressed={selectedKey === null}
        className={cn(chipClass, selectedKey === null ? selectedClass : idleClass)}
      >
        All
      </button>
      {tags.map(({ key, label, count }) => {
        const selected = key === selectedKey;
        return (
          <button
            key={key}
            onClick={() => selectTag(selected ? null : label)}
            aria-pressed={selected}
            className={cn(chipClass, selected ? selectedClass : idleClass)}
          >
            {label}
            <span className="tabular-nums opacity-60">{count}</span>
            {selected && <X className="h-3.5 w-3.5" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
