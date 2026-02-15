"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  PenTool,
  ListTodo,
  BarChart3,
  Users,
  FileText,
  Calendar,
} from "lucide-react"

const pages = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Generate Post", href: "/generate", icon: PenTool },
  { name: "Jobs", href: "/jobs", icon: ListTodo },
  { name: "Schedules", href: "/schedules", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Subscribers", href: "/subscribers", icon: Users },
  { name: "Templates", href: "/templates", icon: FileText },
]

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="페이지 검색..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => {
                router.push(page.href)
                setOpen(false)
              }}
            >
              <page.icon className="mr-2 size-4" />
              {page.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
