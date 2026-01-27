"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PartyPopper, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export default function SubscribeCompletePage() {
  useEffect(() => {
    // 페이지 로드 시 가운데서 한 번 터지는 confetti 효과
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: colors,
    });
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
        >
          <PartyPopper className="h-10 w-10 text-green-600" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-3 text-3xl font-bold tracking-tight"
        >
          구독이 완료되었습니다!
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-4 text-foreground/70"
        >
          새로운 글이 발행되면 이메일로 알려드릴게요.
        </motion.p>

        {/* Contact Info */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8 text-sm text-foreground/60"
        >
          문의사항은{" "}
          <a
            href="mailto:kevinxkim2023@gmail.com"
            className="text-electric-blue underline underline-offset-2 hover:text-blue-dark"
          >
            kevinxkim2023@gmail.com
          </a>
          으로 연락주세요.
        </motion.p>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/">
            <Button variant="secondary" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              블로그로 돌아가기
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
