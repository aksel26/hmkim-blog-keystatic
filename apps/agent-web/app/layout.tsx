import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { QueryProvider } from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Agent - 블로그 포스트 생성기",
  description: "AI 기반 블로그 포스트 생성 및 관리 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider delayDuration={300}>
              <SidebarProvider>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <Header />
                    <main className="flex flex-col flex-1 overflow-y-auto p-6 bg-background">
                      {children}
                    </main>
                  </div>
                </div>
                <Toaster />
              </SidebarProvider>
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
