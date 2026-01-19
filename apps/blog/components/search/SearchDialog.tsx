"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { josa, disassemble, getChoseong } from "es-hangul";
import { SearchItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SearchItem[];
}

export function SearchDialog({ open, onOpenChange, items }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      // Focus input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      setQuery("");
      setSelectedIndex(0);

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false);
        }
      };
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [open, onOpenChange]);

  // Filter items based on query using es-hangul
  const filteredItems = React.useMemo(() => {
    if (!query) return [];

    // Normalize query for case-insensitive search
    // remove whitespace for looser matching if desired, but strict for now
    const normalizedQuery = query.toLowerCase();
    const disassembledQuery = disassemble(query);

    return items.filter((item) => {
      if (!item.title) return false;
      const title = item.title;

      // 1. Standard search (includes check)
      if (title.toLowerCase().includes(normalizedQuery)) return true;

      // 2. Choseong search
      const choseong = getChoseong(title);
      if (choseong.includes(query)) return true;

      // 3. Disassembled search (for partial matches)
      const disassembledTitle = disassemble(title);
      if (disassembledTitle.includes(disassembledQuery)) return true;

      return item.category.includes(normalizedQuery);
    });
  }, [query, items]);

  // Handle keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredItems.length) % filteredItems.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        router.push(filteredItems[selectedIndex].slug);
        onOpenChange(false);
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] sm:pt-[15vh] px-4"
            onClick={() => onOpenChange(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-2xl "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center px-3">
                <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0); // Reset selection on query change
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="제목이나 카테고리로 검색..."
                  className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <div className="flex items-center gap-2">
                  <kbd className="hidden pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                    <span className="text-xs">ESC</span>
                  </kbd>
                </div>
              </div>

              {query && (
                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
                  {filteredItems.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      검색 결과가 없습니다.
                    </p>
                  ) : (
                    <div className="px-2">
                      {filteredItems.map((item, index) => (
                        <div
                          key={item.slug}
                          onClick={() => {
                            router.push(item.slug);
                            onOpenChange(false);
                          }}
                          onMouseMove={() => setSelectedIndex(index)}
                          className={cn(
                            "relative flex cursor-default select-none items-center justify-between rounded-sm px-2 py-2 text-sm outline-none",
                            index === selectedIndex
                              ? "bg-accent text-accent-foreground"
                              : ""
                          )}
                        >
                          <span className="font-medium truncate mr-2">
                            {item.title}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize shrink-0">
                            {item.category}
                          </span>

                          {index === selectedIndex && (
                            <motion.div
                              layoutId="search-result-active"
                              className="absolute left-0 w-[2px] h-full bg-primary"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!query && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  검색어를 입력하세요.
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
