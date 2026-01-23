"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscribeButtonProps {
  className?: string;
  variant?: "primary" | "outline";
}

export default function SubscribeButton({
  className,
  variant = "primary",
}: SubscribeButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:ring-offset-2";

  const variants = {
    primary: "bg-electric-blue text-white hover:bg-blue-dark px-6 py-3",
    outline:
      "border-2 border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-white px-6 py-3",
  };

  return (
    <Link href="/subscribe" className={cn(baseStyles, variants[variant], className)}>
      <Mail className="h-5 w-5" />
      뉴스레터 구독
    </Link>
  );
}
