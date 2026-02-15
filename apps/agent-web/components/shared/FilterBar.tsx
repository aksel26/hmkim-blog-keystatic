"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  key: string
  placeholder: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

interface FilterBarProps {
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  filters?: FilterConfig[]
  onReset?: () => void
  className?: string
}

export function FilterBar({
  search,
  filters,
  onReset,
  className,
}: FilterBarProps) {
  const hasActiveFilters =
    (search && search.value) ||
    filters?.some((f) => f.value !== "" && f.value !== "all")

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {search && (
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={search.placeholder ?? "검색..."}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {filters?.map((filter) => (
        <NativeSelect
          key={filter.key}
          options={filter.options}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="w-auto min-w-32"
        />
      ))}

      {hasActiveFilters && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="mr-1 size-4" />
          초기화
        </Button>
      )}
    </div>
  )
}
