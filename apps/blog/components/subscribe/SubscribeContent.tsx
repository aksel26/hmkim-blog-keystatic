"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import SubscribeForm from "./SubscribeForm";

const mailIconVariants = {
  initial: { y: 0, rotate: 0 },
  animate: {
    y: [0, -6, 0],
    rotate: [0, -5, 5, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      repeatType: "loop" as const,
      ease: "easeInOut" as const,
    },
  },
  hover: {
    scale: 1.15,
    rotate: [0, -12, 12, -12, 0],
    transition: {
      duration: 0.6,
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

export function SubscribeContent() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <motion.div
        className="w-full max-w-lg"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back Link */}
        <motion.div variants={itemVariants} className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로 돌아가기
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/50 p-8 md:p-10 shadow-xl"
        >
          {/* Icon */}
          <motion.div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center"
            variants={mailIconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            <Image
              src="/images/Mail.webp"
              alt="Newsletter"
              width={64}
              height={64}
              className="object-contain"
            />
          </motion.div>

          {/* Title */}
          <h1 className="mb-3 text-center text-3xl font-bold tracking-tight">
            뉴스레터 구독
          </h1>

          {/* Description */}
          <p className="mb-8 text-center text-foreground/60 leading-relaxed">
            새로운 글이 발행되면 이메일로 알려드립니다.
            <br />
          </p>

          {/* Form */}
          <SubscribeForm />

        </motion.div>

        {/* Footer note */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-center text-xs text-foreground/40"
        >
          이메일 주소는 뉴스레터 발송 목적으로만 사용됩니다.
        </motion.p>
      </motion.div>
    </main>
  );
}
