"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, User, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import PrivacyModal from "./PrivacyModal";

export default function SubscribeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!privacyAgreed) {
      setError("개인정보 수집에 동의해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, privacyAgreed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "구독 처리 중 오류가 발생했습니다.");
        return;
      }

      // 성공 시 완료 페이지로 이동
      router.push("/subscribe/complete");
    } catch (err) {
      setError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Name Input */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            이름
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/20 transition-all"
            />
          </div>
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            이메일 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/20 transition-all"
            />
          </div>
        </div>

        {/* Privacy Agreement */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="privacy"
            checked={privacyAgreed}
            onChange={(e) => setPrivacyAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-background text-electric-blue focus:ring-electric-blue cursor-pointer"
          />
          <label htmlFor="privacy" className="text-sm text-foreground/80 cursor-pointer">
            개인정보 수집 및 이용에 동의합니다{" "}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-electric-blue underline underline-offset-2 hover:text-blue-dark transition-colors"
            >
              자세히 보기
            </button>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 text-gray-800 dark:bg-gray-100 dar hover:scale-105"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : (
            "동의 및 구독하기"
          )}
        </Button>
      </motion.form>

      <PrivacyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
