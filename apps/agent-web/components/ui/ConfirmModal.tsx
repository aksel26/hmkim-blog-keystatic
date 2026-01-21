"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { Button } from "./Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  variant = "default",
  isLoading = false,
  children,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: "text-destructive",
          button: "bg-destructive hover:bg-destructive/90",
        };
      case "warning":
        return {
          icon: "text-yellow-500",
          button: "bg-yellow-500 hover:bg-yellow-600",
        };
      default:
        return {
          icon: "text-primary",
          button: "bg-primary hover:bg-primary/90",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="mb-4">
          <h2
            id="modal-title"
            className={`text-lg font-semibold ${styles.icon}`}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Content */}
        {children && <div className="mb-6">{children}</div>}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">&#8987;</span>
                처리 중...
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
