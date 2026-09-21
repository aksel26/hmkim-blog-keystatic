"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  { name: "대시보드", href: "/" },
  { name: "포스트 생성", href: "/generate" },
  { name: "작업 목록", href: "/jobs" },
  { name: "트렌드", href: "/schedules" },
  { name: "분석", href: "/analytics" },
  { name: "구독자", href: "/subscribers" },
  { name: "템플릿", href: "/templates" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  // 모바일 Sheet는 클라이언트 라우팅 후에도 열려 있으므로 이동 시 직접 닫는다
  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 pt-4 pb-2">
        <Link href="/" onClick={closeMobile} className="block">
          <span className="text-xl font-bold tracking-tight">AI Agent</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">블로그 편집 데스크</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item, index) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-9 gap-3 px-2 text-muted-foreground data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-foreground data-[active=true]:hover:bg-sidebar-accent"
                    >
                      <Link href={item.href} onClick={closeMobile}>
                        {/* 아이콘 대신 번호로 위치를 짚는다. 현재 메뉴는 이름이 굵어지고 번호가 먹색으로 진해진다 */}
                        <span
                          className={
                            isActive
                              ? "text-xs tabular-nums text-pencil"
                              : "text-xs tabular-nums text-muted-foreground/60"
                          }
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-4">
        <p className="text-xs text-muted-foreground/70">v0.1.0</p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
