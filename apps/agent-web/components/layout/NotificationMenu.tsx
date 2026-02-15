"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

export function NotificationMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="알림">
          <Bell className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>알림</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-4 text-center text-sm text-muted-foreground">
          새로운 알림이 없습니다.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
