"use client";

import * as React from "react";
import { useRef, useEffect, useState } from "react";

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Popover({
  trigger,
  children,
  align = "center",
  side = "bottom",
  className = "",
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const getPositionClasses = () => {
    const positions: Record<string, string> = {
      "top-start": "bottom-full left-0 mb-2",
      "top-center": "bottom-full left-1/2 -translate-x-1/2 mb-2",
      "top-end": "bottom-full right-0 mb-2",
      "bottom-start": "top-full left-0 mt-2",
      "bottom-center": "top-full left-1/2 -translate-x-1/2 mt-2",
      "bottom-end": "top-full right-0 mt-2",
      "left-start": "right-full top-0 mr-2",
      "left-center": "right-full top-1/2 -translate-y-1/2 mr-2",
      "left-end": "right-full bottom-0 mr-2",
      "right-start": "left-full top-0 ml-2",
      "right-center": "left-full top-1/2 -translate-y-1/2 ml-2",
      "right-end": "left-full bottom-0 ml-2",
    };

    return positions[`${side}-${align}`] || positions["bottom-center"];
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-50 min-w-[280px] rounded-lg border border-border bg-card p-4 shadow-lg ${getPositionClasses()} ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function PopoverTrigger({ children }: PopoverTriggerProps) {
  return <>{children}</>;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PopoverContent({ children, className = "" }: PopoverContentProps) {
  return <div className={className}>{children}</div>;
}
