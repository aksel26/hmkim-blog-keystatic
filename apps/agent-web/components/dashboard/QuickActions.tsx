"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PenTool, ListTodo, BarChart3 } from "lucide-react";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/generate" className="block">
          <Button className="w-full justify-start gap-2" size="lg">
            <PenTool className="h-5 w-5" />
            Generate New Post
          </Button>
        </Link>

        <Link href="/jobs?status=human_review" className="block">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            size="lg"
          >
            <ListTodo className="h-5 w-5" />
            Review Pending Posts
          </Button>
        </Link>

        <Link href="/analytics" className="block">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            size="lg"
          >
            <BarChart3 className="h-5 w-5" />
            View Analytics
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
