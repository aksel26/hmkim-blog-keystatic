"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

function NativeSelect({
  className,
  options,
  placeholder,
  ...props
}: NativeSelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-2 pr-10 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}

export { NativeSelect }
