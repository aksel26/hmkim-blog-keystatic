"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, ListTodo, BarChart3 } from "lucide-react";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>빠른 작업</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/generate" className="block">
          <Button className="w-full justify-start gap-2" size="lg">
            <PenTool className="h-5 w-5" />
            새 포스트 생성
          </Button>
        </Link>

        <Link href="/jobs?status=human_review" className="block">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            size="lg"
          >
            <ListTodo className="h-5 w-5" />
            대기 중인 포스트 검토
          </Button>
        </Link>

        <Link href="/analytics" className="block">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            size="lg"
          >
            <BarChart3 className="h-5 w-5" />
            분석 보기
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
