"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import { CheckCircle, AlertCircle, XCircle, FileText } from "lucide-react";
import type { PostMetadata } from "@/lib/types";

interface ContentPreviewProps {
  draftContent?: string | null;
  finalContent: string | null;
  metadata: PostMetadata | null;
}

type Tab = "content" | "metadata" | "seo";

interface CheckItem {
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
  description: string;
}

/**
 * 마크다운 코드 블록 래퍼 제거
 * ```markdown ... ``` 형태로 감싸진 콘텐츠에서 래퍼를 제거
 */
function unwrapMarkdownCodeBlock(content: string): string {
  if (!content) return "";

  const trimmed = content.trim();

  // ```markdown 또는 ```md로 시작하고 ```로 끝나는 경우
  const codeBlockRegex = /^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/i;
  const match = trimmed.match(codeBlockRegex);

  if (match) {
    return match[1].trim();
  }

  return trimmed;
}

export function ContentPreview({
  finalContent,
  metadata,
}: ContentPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    finalContent ? "content" : "metadata"
  );

  // 마크다운 코드 블록 래퍼 제거된 콘텐츠
  const cleanContent = useMemo(() => {
    return unwrapMarkdownCodeBlock(finalContent || "");
  }, [finalContent]);

  // SEO 체크 항목 계산
  const seoChecks = useMemo((): CheckItem[] => {
    const items: CheckItem[] = [];
    const content = cleanContent;

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
  }, [cleanContent, metadata]);

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

  const passCount = seoChecks.filter((c) => c.status === "pass").length;
  const seoScore = Math.round((passCount / seoChecks.length) * 100);

  const tabs: Array<{ id: Tab; label: string; disabled: boolean }> = [
    { id: "content", label: "Content", disabled: !finalContent },
    { id: "metadata", label: "Metadata", disabled: !metadata },
    { id: "seo", label: `SEO ${finalContent ? `${seoScore}%` : ""}`, disabled: !finalContent },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "content":
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{cleanContent}</ReactMarkdown>
          </div>
        );

      case "metadata":
        return metadata ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Title
              </label>
              <p className="text-lg font-semibold">{metadata.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Summary
              </label>
              <p>{metadata.summary}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Slug
              </label>
              <p className="font-mono text-sm">{metadata.slug}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-muted rounded-md text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Keywords
              </label>
              <p className="text-sm">{metadata.keywords.join(", ")}</p>
            </div>

            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <p className="text-sm">{metadata.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <p className="text-sm capitalize">{metadata.status}</p>
              </div>
            </div>
          </div>
        ) : null;

      case "seo":
        return (
          <div className="space-y-4">
            {/* 점수 헤더 */}
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm font-medium">SEO 체크리스트</span>
              <span
                className={`text-lg font-bold ${
                  seoScore >= 80
                    ? "text-green-500"
                    : seoScore >= 60
                      ? "text-yellow-500"
                      : "text-red-500"
                }`}
              >
                {seoScore}점
              </span>
            </div>
            {/* 프로그레스 바 */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  seoScore >= 80
                    ? "bg-green-500"
                    : seoScore >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${seoScore}%` }}
              />
            </div>
            {/* 체크 항목들 */}
            <div className="space-y-3">
              {seoChecks.map((check, i) => (
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">콘텐츠 미리보기</CardTitle>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`text-xs h-7 px-3 ${activeTab === tab.id ? "" : "hover:bg-background/50"}`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full min-h-[400px] max-h-[600px] overflow-y-auto pr-2">
          {renderContent() || (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p>아직 콘텐츠가 없습니다</p>
              <p className="text-xs mt-1">작업이 진행되면 여기에 표시됩니다</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
