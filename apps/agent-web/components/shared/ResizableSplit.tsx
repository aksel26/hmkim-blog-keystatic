"use client";

import { useEffect, useRef } from "react";

interface ResizableSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  /** 놓은 위치를 기억할 localStorage 키 */
  storageKey: string;
  /** 왼쪽 패널의 기본 너비(%) */
  defaultLeft?: number;
  min?: number;
  max?: number;
}

/**
 * 좌우 두 패널 사이를 드래그해 너비를 나누는 분할기. lg 미만에서는 위아래로 쌓이고 손잡이가 숨는다.
 *
 * 너비는 React 상태가 아니라 컨테이너의 CSS 변수(--left)로 들고 있다. 드래그 중에 상태를 바꾸면
 * 패널 안의 마크다운 본문이 포인터가 움직일 때마다 다시 렌더링된다.
 * 손잡이: 드래그, ←/→(2%씩), Home/End(최소/최대), 더블클릭(기본값으로).
 */
export function ResizableSplit({ left, right, storageKey, defaultLeft = 70, min = 35, max = 80 }: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(defaultLeft);

  const apply = (next: number, persist = false) => {
    const value = Math.round(Math.min(max, Math.max(min, next)) * 10) / 10;
    valueRef.current = value;
    containerRef.current?.style.setProperty("--left", String(value));
    handleRef.current?.setAttribute("aria-valuenow", String(Math.round(value)));
    if (persist) {
      try {
        localStorage.setItem(storageKey, String(value));
      } catch {
        // 저장이 막힌 환경(사생활 보호 모드 등)에서는 기억하지 않을 뿐이다
      }
    }
  };

  // 저장된 위치는 마운트 뒤에 DOM에 바로 적용한다 (서버 렌더 결과와 어긋나지 않게 상태로 두지 않는다)
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(storageKey));
      if (stored) apply(stored);
    } catch {
      // 읽기가 막혀 있으면 기본값을 쓴다
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    handle.dataset.dragging = "true";
    const rect = container.getBoundingClientRect();
    // 드래그 중 본문 텍스트가 선택되지 않게 한다
    document.body.style.userSelect = "none";

    const onMove = (ev: PointerEvent) => apply(((ev.clientX - rect.left) / rect.width) * 100);
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      delete handle.dataset.dragging;
      document.body.style.userSelect = "";
      apply(valueRef.current, true);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const next = { ArrowLeft: valueRef.current - 2, ArrowRight: valueRef.current + 2, Home: min, End: max }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    apply(next, true);
  };

  return (
    <div
      ref={containerRef}
      style={{ "--left": defaultLeft } as React.CSSProperties}
      className="grid grid-cols-1 gap-4 lg:gap-0 lg:grid-cols-[minmax(0,calc(var(--left)*1%))_1rem_minmax(0,1fr)]"
    >
      {left}
      <div
        ref={handleRef}
        role="separator"
        aria-orientation="vertical"
        aria-label="미리보기와 메타데이터의 너비 조절"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={defaultLeft}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onDoubleClick={() => apply(defaultLeft, true)}
        title="드래그해서 너비 조절 · 더블클릭하면 기본값"
        className="group hidden cursor-col-resize touch-none items-center justify-center outline-none lg:flex"
      >
        {/* 평소에는 옅은 짧은 선, 올리거나 끌거나 포커스하면 먹색으로 길어진다 */}
        <span className="h-10 w-[3px] rounded-full bg-border transition-[height,background-color] duration-150 ease-out group-hover:h-16 group-hover:bg-foreground group-focus-visible:h-16 group-focus-visible:bg-foreground group-data-[dragging=true]:h-16 group-data-[dragging=true]:bg-foreground" />
      </div>
      {right}
    </div>
  );
}
