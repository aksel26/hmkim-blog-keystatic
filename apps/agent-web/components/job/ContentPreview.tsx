"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import type { PostMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ResizableSplit } from "@/components/shared/ResizableSplit";
import { DEFAULT_THUMBNAIL_STYLE, THUMBNAIL_PRESETS } from "@agent/ai-agents/config/thumbnail-presets";

interface ContentPreviewProps {
  jobId: string;
  draftContent?: string | null;
  finalContent: string | null;
  metadata: PostMetadata | null;
  thumbnailData?: string | null;
  editable?: boolean;
  onContentSave?: (content: string) => Promise<void>;
  onThumbnailRegenerated?: (thumbnailData: string) => void;
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
  jobId,
  finalContent,
  metadata,
  thumbnailData,
  editable = false,
  onContentSave,
  onThumbnailRegenerated,
}: ContentPreviewProps) {
  // 본문은 왼쪽(7)에 늘 보이고, 오른쪽(3) 패널만 메타데이터와 SEO를 오간다
  const [sideTab, setSideTab] = useState<Exclude<Tab, "content">>("metadata");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [thumbnailPrompt, setThumbnailPrompt] = useState(DEFAULT_THUMBNAIL_STYLE);
  const [isRegeneratingThumbnail, setIsRegeneratingThumbnail] = useState(false);
  const [currentThumbnailData, setCurrentThumbnailData] = useState(thumbnailData);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // thumbnailData prop 변경 시 로컬 state 동기화
  // (워크플로우 진행 중 React Query refetch로 prop이 업데이트될 때)
  useEffect(() => {
    setCurrentThumbnailData(thumbnailData);
  }, [thumbnailData]);

  const handleRegenerateThumbnail = async () => {
    setIsRegeneratingThumbnail(true);
    try {
      const body: Record<string, string> = {};
      if (thumbnailPrompt.trim()) {
        body.prompt = thumbnailPrompt.trim();
      }
      const res = await fetch(`/api/jobs/${jobId}/thumbnail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "썸네일 재생성에 실패했습니다");
      }
      const data = await res.json();
      setCurrentThumbnailData(data.thumbnailData);
      onThumbnailRegenerated?.(data.thumbnailData);
      if (data.prompt) {
        setThumbnailPrompt(data.prompt);
      }
    } catch (error) {
      console.error("Thumbnail regeneration failed:", error);
    } finally {
      setIsRegeneratingThumbnail(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("PNG, JPEG, WebP 형식만 지원합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/jobs/${jobId}/thumbnail/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "썸네일 업로드에 실패했습니다");
      }
      const data = await res.json();
      setCurrentThumbnailData(data.thumbnailData);
      onThumbnailRegenerated?.(data.thumbnailData);
    } catch (error) {
      console.error("Thumbnail upload failed:", error);
      alert(error instanceof Error ? error.message : "업로드에 실패했습니다.");
    } finally {
      setIsUploadingThumbnail(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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

  // 아이콘 대신 색을 입힌 낱말로 결과를 알린다
  const statusText = { pass: "통과", warn: "주의", fail: "미흡" } as const;
  const statusColor = { pass: "text-success", warn: "text-warning", fail: "text-destructive" } as const;
  // Tailwind는 조립한 클래스 이름을 감지하지 못하므로 완성된 이름을 그대로 둔다
  const scoreText = (score: number) => (score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive");
  const scoreBg = (score: number) => (score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive");

  const passCount = seoChecks.filter((c) => c.status === "pass").length;
  const seoScore = Math.round((passCount / seoChecks.length) * 100);

  const sideTabs: Array<{ id: Exclude<Tab, "content">; label: string; disabled: boolean }> = [
    { id: "metadata", label: "메타데이터", disabled: !metadata },
    { id: "seo", label: `SEO ${finalContent ? `${seoScore}%` : ""}`, disabled: !finalContent },
  ];

  const handleStartEdit = () => {
    setEditContent(cleanContent);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const handleSave = async () => {
    if (!onContentSave) return;
    setIsSaving(true);
    try {
      await onContentSave(editContent);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = (tab: Tab) => {
    switch (tab) {
      case "content":
        if (isEditing) {
          return (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[400px] max-h-[600px] font-mono text-sm"
                placeholder="마크다운 콘텐츠를 작성하세요..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중…" : "저장"}
                </Button>
              </div>
            </div>
          );
        }
        return (
          <div className="prose prose-sm prose-neutral prose-code:before:content-none prose-code:after:content-none dark:prose-invert max-w-none">
            <ReactMarkdown>{cleanContent}</ReactMarkdown>
          </div>
        );

      case "metadata":
        return metadata ? (
          <div className="space-y-4">
            {/* 썸네일 미리보기 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                썸네일
              </label>
              {currentThumbnailData ? (
                <div className="mt-1">
                  <Image
                    src={`data:image/png;base64,${currentThumbnailData}`}
                    alt="썸네일 미리보기"
                    width={1280}
                    height={720}
                    unoptimized
                    className="h-auto w-full rounded-md object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                  />
                </div>
              ) : (
                <div
                  className="mt-1 rounded-md border border-dashed border-input flex items-center justify-center text-muted-foreground text-sm"
                  style={{ aspectRatio: '16/9' }}
                >
                  썸네일 없음
                </div>
              )}
              {metadata.thumbnailImage && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {metadata.thumbnailImage}
                </p>
              )}
              {editable && (
                <div className="mt-2 space-y-2">
                  {/* 화풍 프리셋. 누르면 아래 입력창에 채워지고, 입력창에서 고쳐 쓸 수도 있다 */}
                  <div className="flex flex-wrap gap-1" role="group" aria-label="썸네일 화풍 프리셋">
                    {THUMBNAIL_PRESETS.map((preset) => {
                      const selected = thumbnailPrompt.trim() === preset.style;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setThumbnailPrompt(preset.style)}
                          disabled={isRegeneratingThumbnail}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.96] disabled:opacity-50",
                            selected
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "shadow-border text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={thumbnailPrompt}
                      onChange={(e) => setThumbnailPrompt(e.target.value)}
                      placeholder="화풍을 직접 입력하세요 (영문 권장)"
                      className="text-sm"
                      disabled={isRegeneratingThumbnail}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateThumbnail}
                      disabled={isRegeneratingThumbnail}
                      className="shrink-0"
                    >
                      {isRegeneratingThumbnail ? "생성 중…" : "재생성"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingThumbnail}
                      className="shrink-0"
                    >
                      {isUploadingThumbnail ? "업로드 중…" : "이미지 업로드"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPEG, WebP (최대 5MB)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                제목
              </label>
              <p className="text-lg font-semibold">{metadata.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                요약
              </label>
              <p>{metadata.summary}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                슬러그
              </label>
              <p className="font-mono text-sm">{metadata.slug}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                태그
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {metadata.tags.map((tag) => (
                  <span key={tag} className="text-sm text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                키워드
              </label>
              <p className="text-sm">{metadata.keywords.join(", ")}</p>
            </div>

            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  생성일
                </label>
                <p className="text-sm">{metadata.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  상태
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
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-muted-foreground">SEO 체크리스트</span>
              <span className={`text-3xl leading-none font-bold tabular-nums ${scoreText(seoScore)}`}>
                {seoScore}점
              </span>
            </div>
            {/* 프로그레스 바 */}
            <div className="w-full bg-foreground/10 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-[width] duration-300 ease-out ${scoreBg(seoScore)}`}
                style={{ width: `${seoScore}%` }}
              />
            </div>
            {/* 체크 항목들 */}
            <div className="space-y-3">
              {seoChecks.map((check, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 text-sm"
                >
                  <span className={`w-8 shrink-0 text-xs font-semibold leading-5 ${statusColor[check.status]}`}>
                    {statusText[check.status]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{check.label}</span>
                      <span className={`text-xs ${statusColor[check.status]}`}>
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

  const emptyState = (title: string) => (
    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
      <p className="text-xl font-bold tracking-tight text-foreground">{title}</p>
      <p className="text-xs mt-1">작업이 진행되면 여기에 표시됩니다</p>
    </div>
  );
  // SEO는 본문이 있어야 계산된다. 고른 탭을 쓸 수 없으면 메타데이터로 돌아간다
  const activeSideTab = sideTabs.find((t) => t.id === sideTab && !t.disabled)?.id ?? "metadata";

  return (
    // 기본은 미리보기 7 : 메타데이터 3. 가운데 손잡이를 끌어 너비를 바꾸고, 놓은 위치는 브라우저에 기억된다
    <ResizableSplit
      storageKey="agent-web:job-preview-split"
      defaultLeft={70}
      left={
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>콘텐츠 미리보기</CardTitle>
                {editable && finalContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isEditing ? handleCancelEdit : handleStartEdit}
                    className="text-xs h-7 px-3"
                  >
                    {isEditing ? "미리보기" : "편집"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="h-full min-h-[400px] max-h-[600px] overflow-y-auto pr-2">
                {finalContent ? renderContent("content") : emptyState("아직 콘텐츠가 없습니다")}
              </div>
            </CardContent>
          </Card>
      }
      right={
        // SEO 체크리스트도 이 패널의 탭이다
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex gap-1">
                {sideTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeSideTab === tab.id && !tab.disabled ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSideTab(tab.id)}
                    disabled={tab.disabled}
                    className="text-xs h-7 px-3"
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="h-full min-h-[400px] max-h-[600px] overflow-y-auto pr-2">
                {renderContent(activeSideTab) || emptyState("아직 메타데이터가 없습니다")}
              </div>
            </CardContent>
          </Card>
      }
    />
  );
}
