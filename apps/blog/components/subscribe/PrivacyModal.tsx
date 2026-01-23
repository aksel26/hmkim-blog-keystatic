"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background p-6 shadow-xl"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">개인정보 수집 및 이용 동의</h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-sm text-foreground/80">
              <div>
                <h3 className="font-medium text-foreground">1. 수집 항목</h3>
                <p className="mt-1">이름, 이메일 주소</p>
              </div>

              <div>
                <h3 className="font-medium text-foreground">2. 수집 목적</h3>
                <p className="mt-1">뉴스레터 발송 및 새 글 알림 서비스 제공</p>
              </div>

              <div>
                <h3 className="font-medium text-foreground">3. 보유 기간</h3>
                <p className="mt-1">구독 해지 시까지</p>
              </div>

              <div>
                <h3 className="font-medium text-foreground">4. 동의 거부 권리</h3>
                <p className="mt-1">
                  귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가
                  있습니다. 다만, 동의를 거부하실 경우 뉴스레터 구독 서비스를
                  이용하실 수 없습니다.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <Button onClick={onClose}>확인</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
