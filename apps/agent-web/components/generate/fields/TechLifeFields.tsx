"use client";

import { useFormContext, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { TechFormData } from "@/lib/schemas/form-schemas";

const templateOptions = [
  { value: "default", label: "기본" },
  { value: "tutorial", label: "튜토리얼" },
  { value: "comparison", label: "비교분석" },
  { value: "deep-dive", label: "심층분석" },
  { value: "tips", label: "팁 & 트릭" },
];

export function TechLifeFields() {
  const {
    register,
    formState: { errors: formErrors },
  } = useFormContext();

  const errors = formErrors as FieldErrors<TechFormData>;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <h3 className="font-semibold text-sm text-muted-foreground">
        Tech/Life 포스트
      </h3>

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
        <Select
          {...register("template")}
          options={templateOptions}
          placeholder="템플릿을 선택하세요"
        />
      </div>
    </div>
  );
}
