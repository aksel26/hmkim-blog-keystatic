import { cn } from "@/lib/utils"

// 스피너 아이콘 대신 쓰는 로딩 표시
export function LoadingText({
  children = "불러오는 중…",
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <p role="status" className={cn("animate-pulse text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}
