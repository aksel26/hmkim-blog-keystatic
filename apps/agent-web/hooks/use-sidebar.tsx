"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"

interface SidebarContextValue {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

const STORAGE_KEY = "sidebar-collapsed"

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setCollapsedState(stored === "true")
    }
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }, [])

  const toggle = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed, setCollapsed])

  return (
    <SidebarContext value={{ collapsed, toggle, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return context
}
