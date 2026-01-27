"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface NewsletterCTAProps {
  variant?: "default" | "compact" | "banner";
  className?: string;
}

// 메일 아이콘 애니메이션 variants
const mailIconVariants = {
  initial: { y: 0, rotate: 0 },
  animate: {
    y: [0, -4, 0],
    rotate: [0, -5, 5, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop" as const,
      ease: "easeInOut" as const,
    },
  },
  hover: {
    scale: 1.1,
    rotate: [0, -10, 10, -10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

export function NewsletterCTA({
  variant = "default",
  className = "",
}: NewsletterCTAProps) {
  if (variant === "banner") {
    return (
      <div
        className={`bg-gradient-to-r from-electric-blue/10 via-purple-500/10 to-pink-500/10 dark:from-electric-blue/20 dark:via-purple-500/20 dark:to-pink-500/20 ${className}`}
      >
        <div className="container mx-auto max-w-4xl px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="flex h-12 w-12 items-center justify-center"
                variants={mailIconVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <Image
                  src="/images/Mail.webp"
                  alt="Newsletter"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </motion.div>
              <div className="text-center sm:text-left">
                <p className="font-semibold">새 글 알림 받기</p>
                <p className="text-sm text-foreground/60">
                  새로운 글이 발행되면 이메일로 알려드립니다
                </p>
              </div>
            </div>
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 rounded-full bg-electric-blue px-6 py-2.5 font-medium text-white transition-all hover:bg-blue-600 active:scale-95"
            >
              구독하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center justify-center gap-3 rounded-lg border border-electric-blue/20 bg-electric-blue/5 px-4 py-3 ${className}`}
      >
        <motion.div
          variants={mailIconVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
        >
          <Image
            src="/images/Mail.webp"
            alt="Newsletter"
            width={20}
            height={20}
            className="object-contain"
          />
        </motion.div>
        <span className="text-sm">새 글 알림을 받고 싶으신가요?</span>
        <Link
          href="/subscribe"
          className="text-sm font-medium text-electric-blue hover:underline"
        >
          구독하기 →
        </Link>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8 text-center ${className}`}
    >
      <motion.div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center"
        variants={mailIconVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        <Image
          src="/images/Mail.webp"
          alt="Newsletter"
          width={48}
          height={48}
          className="object-contain"
        />
      </motion.div>

      <h3 className="mb-2 text-xl font-bold">이 글이 도움이 되셨나요?</h3>

      <p className="mb-6 text-foreground/60">
        새로운 글이 발행되면 이메일로 알려드립니다.
      </p>

      <Link
        href="/subscribe"
        className="inline-flex items-center gap-2 rounded-full bg-electric-blue px-8 py-3 font-medium dark:text-black hover:dark:text-white text-white transition-all hover:bg-blue-600 hover:shadow-lg dark:hover:shadow-electric-blue/10 hover:shadow-electric-blue/25 active:scale-95"
      >
        뉴스레터 구독하기
      </Link>
    </div>
  );
}
