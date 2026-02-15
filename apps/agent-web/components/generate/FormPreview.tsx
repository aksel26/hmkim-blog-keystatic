"use client";

import { useFormContext } from "react-hook-form";
import {
  categoryOptions,
  templateOptions,
  toneOptions,
  type BlogFormData,
} from "@/lib/schemas/form-schemas";

function findLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | undefined,
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? null;
}

export function FormPreview() {
  const { watch } = useFormContext<BlogFormData>();
  const values = watch();

  const rows: Array<{ label: string; value: string | null }> = [
    { label: "카테고리", value: findLabel(categoryOptions, values.category) },
    { label: "주제", value: values.topic || null },
    { label: "템플릿", value: findLabel(templateOptions, values.template) },
    { label: "말투", value: findLabel(toneOptions, values.tone) },
    { label: "타겟 독자", value: values.targetReader || null },
    { label: "키워드", value: (values as Record<string, unknown>).keywords as string | null ?? null },
  ];

  const filledCount = rows.filter((r) => r.value).length;

  return (
    <div className="sticky top-6 space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-muted-foreground">미리보기</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {filledCount}/{rows.length}
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-xs text-muted-foreground">{row.label}</p>
            <p className="text-sm mt-0.5">
              {row.value || (
                <span className="text-muted-foreground/50">—</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
