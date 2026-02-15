"use client";

import { Controller, useFormContext, type FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { templateOptions } from "@/lib/schemas/form-schemas";
import type { TechFormData } from "@/lib/schemas/form-schemas";

export function TechLifeFields() {
  const {
    register,
    control,
    formState: { errors: formErrors },
  } = useFormContext();

  const errors = formErrors as FieldErrors<TechFormData>;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">주제 *</label>
        <Input
          {...register("topic")}
          placeholder="예: React Server Components 완벽 가이드"
        />
        {errors.topic && (
          <p className="text-xs text-destructive">{errors.topic.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">템플릿</label>
        <Controller
          name="template"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? "default"} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  );
}
