import { Metadata } from "next";
import Link from "next/link";
import { MailX, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "구독 해지 완료 | HM Blog",
  description: "뉴스레터 구독이 해지되었습니다.",
};

export default function UnsubscribedPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <MailX className="h-8 w-8 text-gray-500" />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold tracking-tight">구독이 해지되었습니다</h1>

        {/* Description */}
        <p className="mb-4 text-foreground/70">
          더 이상 이메일 알림을 받지 않습니다.
        </p>

        <p className="mb-8 text-sm text-foreground/60">
          언제든 다시 구독하실 수 있습니다.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="secondary" className="w-full sm:w-auto gap-2">
              <ArrowLeft className="h-4 w-4" />
              블로그로 돌아가기
            </Button>
          </Link>
          <Link href="/subscribe">
            <Button className="w-full sm:w-auto">
              다시 구독하기
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
