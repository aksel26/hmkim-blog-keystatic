import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { QueryProvider } from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// SUIT Variable (SIL OFL, https://sun.fo/suit/). 제목·숫자·본문을 이 서체 하나로 통일한다.
// 공식 CDN CSS에는 선언이 없어 글자가 늦게 보일 수 있으므로 self-host한다.
const suit = localFont({
  src: "./fonts/SUIT-Variable.woff2",
  weight: "100 900",
  variable: "--font-suit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Agent - 블로그 포스트 생성기",
  description: "AI 기반 블로그 포스트 생성 및 관리 대시보드",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 사이드바가 접힘 상태를 sidebar_state 쿠키에 기록한다. 새로고침 후에도 유지하려고 읽는다.
  const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <html
      lang="ko"
      className={suit.variable}
      suppressHydrationWarning
    >
      <body className="antialiased overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <SidebarProvider defaultOpen={defaultOpen} className="h-svh overflow-hidden">
              <AppSidebar />
              <SidebarInset className="min-w-0 overflow-hidden">
                {/* SidebarProvider 내부 TooltipProvider는 지연 0ms라 본문용 300ms를 다시 건다 */}
                <TooltipProvider delayDuration={300}>
                  <Header />
                  <main className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
                    {children}
                  </main>
                </TooltipProvider>
              </SidebarInset>
              <Toaster />
            </SidebarProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
