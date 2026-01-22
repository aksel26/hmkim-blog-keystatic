import { Metadata } from "next";
import { Mail } from "lucide-react";
import { SubscribeForm } from "@/components/subscribe";

export const metadata: Metadata = {
  title: "뉴스레터 구독 | HM Blog",
  description: "새로운 글이 발행되면 이메일로 알려드립니다.",
};

export default function SubscribePage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-electric-blue/10">
          <Mail className="h-8 w-8 text-electric-blue" />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold tracking-tight">뉴스레터 구독</h1>

        {/* Description */}
        <p className="mb-8 text-foreground/70">
          새로운 글이 발행되면 이메일로 알려드립니다.
        </p>

        {/* Form */}
        <SubscribeForm />
      </div>
    </main>
  );
}
