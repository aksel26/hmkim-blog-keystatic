import { Metadata } from "next";
import { SubscribeContent } from "@/components/subscribe/SubscribeContent";

export const metadata: Metadata = {
  title: "뉴스레터 구독 | HM Blog",
  description: "새로운 글이 발행되면 이메일로 알려드립니다.",
};

export default function SubscribePage() {
  return <SubscribeContent />;
}
