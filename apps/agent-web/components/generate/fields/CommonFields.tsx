"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toneOptions } from "@/lib/schemas/form-schemas";
import type { BlogFormData } from "@/lib/schemas/form-schemas";

export function CommonFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<BlogFormData>();

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <h3 className="font-semibold text-sm text-muted-foreground">공통 설정</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">말투 (Tone)</label>
          <Select
            {...register("tone")}
            options={toneOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            placeholder="말투를 선택하세요"
          />
          {errors.tone && (
            <p className="text-xs text-destructive">{errors.tone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">타겟 독자</label>
          <Input
            {...register("targetReader")}
            placeholder="예: 주식 초보자, 요리 입문자"
          />
          {errors.targetReader && (
            <p className="text-xs text-destructive">
              {errors.targetReader.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">핵심 키워드</label>
        <Input
          {...register("keywords")}
          placeholder="쉼표로 구분하여 입력 (예: React, TypeScript, 성능최적화)"
        />
        {errors.keywords && (
          <p className="text-xs text-destructive">{errors.keywords.message}</p>
        )}
      </div>
    </div>
  );
}
