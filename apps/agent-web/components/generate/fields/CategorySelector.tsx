"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { categoryOptions } from "@/lib/schemas/form-schemas";
import type { BlogFormData } from "@/lib/schemas/form-schemas";

export function CategorySelector() {
  const { setValue, watch } = useFormContext<BlogFormData>();
  const category = watch("category");

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">카테고리</label>
      <div className="flex gap-2">
        {categoryOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setValue("category", opt.value)}
            className={cn(
              "rounded-md px-5 py-2 text-sm transition-colors duration-150",
              category === opt.value
                ? "bg-primary text-primary-foreground font-semibold"
                : "shadow-border text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
