"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { tonePresets } from "@/lib/schemas/form-schemas";
import type { BlogFormData } from "@/lib/schemas/form-schemas";

export function CommonFields() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<BlogFormData>();

  const currentTone = watch("tone");
  const isPreset = tonePresets.some((p) => p.value === currentTone);

  return (
    <div className="space-y-4 pt-2">
      <h3 className="text-lg font-bold tracking-tight">공통 설정</h3>

      {/* 말투 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">말투 (Tone)</label>
        <div className="flex flex-wrap gap-2">
          {tonePresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setValue("tone", preset.value, { shouldValidate: true })}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentTone === preset.value
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "shadow-border text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (isPreset) setValue("tone", "", { shouldValidate: true });
            }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              !isPreset && currentTone !== undefined
                ? "bg-primary text-primary-foreground font-semibold"
                : "shadow-border text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            직접 입력
          </button>
        </div>
        {!isPreset && (
          <Input
            {...register("tone")}
            placeholder="원하는 말투를 직접 입력하세요 (예: ~요체, 반말체)"
            className="mt-2"
          />
        )}
        {errors.tone && (
          <p className="text-xs text-destructive">{errors.tone.message}</p>
        )}
      </div>

      {/* 타겟 독자 */}
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
  );
}
