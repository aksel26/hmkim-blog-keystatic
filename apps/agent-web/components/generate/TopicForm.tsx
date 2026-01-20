"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Loader2 } from "lucide-react";
import type { Category, Template } from "@/lib/types";

const categoryOptions = [
  { value: "tech", label: "Tech" },
  { value: "life", label: "Life" },
];

const templateOptions = [
  { value: "default", label: "Default (No template)" },
  { value: "tutorial", label: "Tutorial" },
  { value: "comparison", label: "Comparison" },
  { value: "deep-dive", label: "Deep Dive" },
  { value: "tips", label: "Tips & Tricks" },
];

export function TopicForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<Category>("tech");
  const [template, setTemplate] = useState<Template>("default");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          template: template === "default" ? undefined : template,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create job");
      }

      const data = await response.json();
      router.push(`/jobs/${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Generate Blog Post</CardTitle>
        <CardDescription>
          Enter a topic and let AI create a comprehensive blog post for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Input */}
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium">
              Topic *
            </label>
            <Textarea
              id="topic"
              placeholder="e.g., How to build a REST API with Node.js and Express"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you want the blog post to cover.
            </p>
          </div>

          {/* Category Select */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select
              id="category"
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              disabled={isSubmitting}
            />
          </div>

          {/* Template Select */}
          <div className="space-y-2">
            <label htmlFor="template" className="text-sm font-medium">
              Template
            </label>
            <Select
              id="template"
              options={templateOptions}
              value={template}
              onChange={(e) => setTemplate(e.target.value as Template)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Choose a template to guide the structure of your blog post.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || !topic.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Job...
              </>
            ) : (
              "Generate Post"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
