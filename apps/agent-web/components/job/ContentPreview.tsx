"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import type { PostMetadata } from "@/lib/types";

interface ContentPreviewProps {
  draftContent?: string | null;
  finalContent: string | null;
  metadata: PostMetadata | null;
}

type Tab = "content" | "metadata";

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

  const tabs: Array<{ id: Tab; label: string; disabled: boolean }> = [
    { id: "content", label: "Content", disabled: !finalContent },
    { id: "metadata", label: "Metadata", disabled: !metadata },
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

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Content Preview</CardTitle>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.disabled}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[300px] max-h-[600px] overflow-y-auto">
          {renderContent() || (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No content available yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
