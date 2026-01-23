"use client";

import { useFormContext } from "react-hook-form";
import { Select } from "@/components/ui/Select";
import { categoryOptions } from "@/lib/schemas/form-schemas";
import type { BlogFormData } from "@/lib/schemas/form-schemas";

export function CategorySelector() {
  const {
    register,
    formState: { errors },
  } = useFormContext<BlogFormData>();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">카테고리 *</label>
      <Select
        {...register("category")}
        options={categoryOptions.map((opt) => ({
          value: opt.value,
          label: `${opt.label} - ${opt.description}`,
        }))}
        placeholder="카테고리를 선택하세요"
      />
      {errors.category && (
        <p className="text-xs text-destructive">{errors.category.message}</p>
      )}
    </div>
  );
}
