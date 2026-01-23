import { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "오류 발생 | HM Blog",
  description: "구독 처리 중 오류가 발생했습니다.",
};

interface ErrorPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function SubscribeErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  const reason = params.reason;

  const getErrorMessage = () => {
    switch (reason) {
      case "invalid":
        return "잘못된 요청입니다.";
      case "server":
        return "서버 오류가 발생했습니다.";
      default:
        return "알 수 없는 오류가 발생했습니다.";
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold tracking-tight">오류가 발생했습니다</h1>

        {/* Description */}
        <p className="mb-8 text-foreground/70">{getErrorMessage()}</p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="secondary" className="w-full sm:w-auto gap-2">
              <ArrowLeft className="h-4 w-4" />
              블로그로 돌아가기
            </Button>
          </Link>
          <Link href="/subscribe">
            <Button className="w-full sm:w-auto gap-2">
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
