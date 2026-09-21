"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-10 shrink-0 items-center justify-between bg-background px-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={toggleSidebar}
      >
        메뉴
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="테마 전환"
      >
        {/* 서버 렌더와 어긋나지 않게 두 라벨을 모두 그리고 CSS로 고른다 */}
        <span className="dark:hidden">다크</span>
        <span className="hidden dark:inline">라이트</span>
      </Button>
    </header>
  );
}
