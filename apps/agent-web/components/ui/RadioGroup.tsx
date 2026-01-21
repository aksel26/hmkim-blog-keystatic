"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      name,
      options,
      value,
      onChange,
      className,
      disabled,
      orientation = "horizontal",
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        className={cn(
          "flex gap-3",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
          className
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "relative flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 transition-colors",
              "hover:bg-accent hover:border-primary/50",
              value === option.value &&
                "border-primary bg-primary/5 ring-1 ring-primary",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={cn(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
                value === option.value
                  ? "border-primary"
                  : "border-muted-foreground"
              )}
            >
              {value === option.value && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{option.label}</span>
              {option.description && (
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export { RadioGroup };
