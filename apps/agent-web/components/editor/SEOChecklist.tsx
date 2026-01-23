"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import type { PostMetadata } from "@/lib/types";

interface SEOChecklistProps {
  content: string;
  metadata?: PostMetadata | null;
}

interface CheckItem {
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
  description: string;
}

export function SEOChecklist({ content, metadata }: SEOChecklistProps) {
  const checks = useMemo((): CheckItem[] => {
    const items: CheckItem[] = [];

    // 1. 제목 길이 체크 (60자 이하)
    const titleLength = metadata?.title?.length ?? 0;
    items.push({
      label: "제목 길이",
      status: titleLength === 0 ? "fail" : titleLength <= 60 ? "pass" : titleLength <= 70 ? "warn" : "fail",
      message: titleLength === 0 ? "제목 없음" : `${titleLength}/60자`,
      description: "검색 결과에서 잘리지 않도록 60자 이하 권장",
    });

    // 2. 메타 설명 길이 (150-160자)
    const summaryLength = metadata?.summary?.length ?? 0;
    items.push({
      label: "메타 설명",
      status:
        summaryLength === 0
          ? "fail"
          : summaryLength >= 150 && summaryLength <= 160
            ? "pass"
            : summaryLength >= 120 && summaryLength <= 180
              ? "warn"
              : "fail",
      message: summaryLength === 0 ? "설명 없음" : `${summaryLength}/150-160자`,
      description: "150-160자 사이가 검색 결과 최적화에 좋음",
    });

    // 3. 키워드 포함 여부
    const keywords = metadata?.keywords ?? [];
    const hasKeywords =
      keywords.length > 0 &&
      keywords.some((kw) => content.toLowerCase().includes(kw.toLowerCase()));
    items.push({
      label: "키워드 포함",
      status: keywords.length === 0 ? "warn" : hasKeywords ? "pass" : "fail",
      message:
        keywords.length === 0
          ? "키워드 없음"
          : hasKeywords
            ? "본문에 키워드 포함됨"
            : "키워드가 본문에 없음",
      description: "핵심 키워드가 본문에 자연스럽게 포함되어야 함",
    });

    // 4. 헤딩 구조 분석
    const h1Count = (content.match(/^# [^#]/gm) || []).length;
    const h2Count = (content.match(/^## [^#]/gm) || []).length;
    const h3Count = (content.match(/^### [^#]/gm) || []).length;
    items.push({
      label: "헤딩 구조",
      status: h1Count === 1 && h2Count >= 2 ? "pass" : h2Count >= 1 ? "warn" : "fail",
      message: `H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}`,
      description: "H1은 1개, H2는 2개 이상 권장",
    });

    // 5. 본문 길이 (한국어 기준 글자 수)
    const charCount = content.replace(/\s+/g, "").length;
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    items.push({
      label: "본문 길이",
      status: charCount >= 1500 ? "pass" : charCount >= 800 ? "warn" : "fail",
      message: `${charCount}자 (${wordCount}단어)`,
      description: "SEO에 좋은 글은 1500자 이상 권장",
    });

    // 6. 이미지 유무
    const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
    items.push({
      label: "이미지",
      status: imageCount >= 1 ? "pass" : "warn",
      message: imageCount === 0 ? "이미지 없음" : `${imageCount}개 이미지`,
      description: "적어도 1개의 이미지 포함 권장",
    });

    // 7. 내부/외부 링크
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length - imageCount;
    items.push({
      label: "링크",
      status: linkCount >= 2 ? "pass" : linkCount >= 1 ? "warn" : "fail",
      message: linkCount === 0 ? "링크 없음" : `${linkCount}개 링크`,
      description: "관련 링크 2개 이상 권장",
    });

    // 8. 문단 구조
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    const avgParagraphLength =
      paragraphs.length > 0
        ? Math.round(
            paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length
          )
        : 0;
    items.push({
      label: "문단 구조",
      status:
        paragraphs.length >= 5 && avgParagraphLength <= 300
          ? "pass"
          : paragraphs.length >= 3
            ? "warn"
            : "fail",
      message: `${paragraphs.length}개 문단 (평균 ${avgParagraphLength}자)`,
      description: "5개 이상 문단, 문단당 300자 이하 권장",
    });

    return items;
  }, [content, metadata]);

  const getIcon = (status: CheckItem["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warn":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const passCount = checks.filter((c) => c.status === "pass").length;
  const score = Math.round((passCount / checks.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">SEO 체크리스트</CardTitle>
          <span
            className={`text-lg font-bold ${
              score >= 80
                ? "text-green-500"
                : score >= 60
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}
          >
            {score}점
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all ${
              score >= 80
                ? "bg-green-500"
                : score >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0"
          >
            <div className="mt-0.5">{getIcon(check.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{check.label}</span>
                <span
                  className={`text-xs ${
                    check.status === "pass"
                      ? "text-green-600"
                      : check.status === "warn"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {check.message}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {check.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
