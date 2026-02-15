"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning"
  isLoading?: boolean
  children?: React.ReactNode
}

function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  variant = "default",
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children && <div className="py-2">{children}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              variant === "destructive" &&
                buttonVariants({ variant: "destructive" }),
              variant === "warning" &&
                "bg-warning text-warning-foreground hover:bg-warning/90"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                처리 중...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Backward-compatible wrapper for old ConfirmModal API
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  ...props
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning"
  isLoading?: boolean
  children?: React.ReactNode
}) {
  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose() }}
      onConfirm={onConfirm}
      {...props}
    />
  )
}

export { ConfirmDialog, ConfirmModal }
