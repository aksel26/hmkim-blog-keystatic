"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Eye, Edit, Save, Loader2 } from "lucide-react";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => Promise<void>;
  title?: string;
  readOnly?: boolean;
}

export function MarkdownEditor({
  content,
  onChange,
  onSave,
  title = "Content Editor",
  readOnly = false,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={mode === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("edit")}
              disabled={readOnly}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant={mode === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("preview")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            {onSave && !readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "edit" ? (
          <Textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[500px] font-mono text-sm"
            placeholder="Write your markdown content here..."
            disabled={readOnly}
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none min-h-[500px] p-4 border border-border rounded-lg overflow-y-auto">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
