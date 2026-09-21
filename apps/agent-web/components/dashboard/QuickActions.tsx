import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>빠른 작업</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild className="w-full justify-start" size="lg">
          <Link href="/generate">새 포스트 생성</Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start" size="lg">
          <Link href="/jobs?status=human_review">대기 중인 포스트 검토</Link>
        </Button>
        <Button asChild variant="link" className="w-full justify-start px-4" size="lg">
          <Link href="/analytics">분석 보기 →</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
