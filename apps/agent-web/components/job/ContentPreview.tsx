"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import type { PostMetadata } from "@/lib/types";

interface ContentPreviewProps {
  draftContent: string | null;
  finalContent: string | null;
  metadata: PostMetadata | null;
}

type Tab = "draft" | "final" | "metadata";

export function ContentPreview({
  draftContent,
  finalContent,
  metadata,
}: ContentPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    finalContent ? "final" : draftContent ? "draft" : "metadata"
  );

  const tabs: Array<{ id: Tab; label: string; disabled: boolean }> = [
    { id: "draft", label: "Draft", disabled: !draftContent },
    { id: "final", label: "Final", disabled: !finalContent },
    { id: "metadata", label: "Metadata", disabled: !metadata },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "draft":
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{draftContent || ""}</ReactMarkdown>
          </div>
        );

      case "final":
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{finalContent || ""}</ReactMarkdown>
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
