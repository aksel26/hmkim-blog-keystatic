import { cn } from "@/lib/utils"

// 숫자 색으로 의미를 전한다: 완료=success, 대기=warning, 실패=destructive, 강조=pencil
const toneClass = {
  default: "text-foreground",
  pencil: "text-pencil",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
} as const

interface KPIStatCardProps {
  title: string
  value: string | number
  description?: string
  tone?: keyof typeof toneClass
  isLoading?: boolean
  trend?: {
    value: number
    label?: string
  }
  className?: string
}

export function KPIStatCard({
  title,
  value,
  description,
  tone = "default",
  isLoading,
  trend,
  className,
}: KPIStatCardProps) {
  return (
    <div className={cn("py-3.5", className)}>
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <p
        className={cn(
          "mt-1.5 text-4xl leading-none font-bold tracking-tight tabular-nums",
          toneClass[tone]
        )}
      >
        {isLoading ? (
          <span className="inline-block h-[1em] w-16 animate-pulse rounded bg-muted align-top" />
        ) : (
          value
        )}
      </p>
      {description && (
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      )}
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs font-medium tabular-nums",
            trend.value > 0 && "text-success",
            trend.value < 0 && "text-destructive",
            trend.value === 0 && "text-muted-foreground"
          )}
        >
          {trend.value > 0 ? "+" : ""}
          {trend.value}%{trend.label ? ` ${trend.label}` : ""}
        </p>
      )}
    </div>
  )
}
