"use client"

import * as React from "react"
import type { User } from "next-auth"

import { NavMain } from "@/features/dashboard/components/nav-main"
import { NavProjects } from "@/features/dashboard/components/nav-projects"
import { NavSecondary } from "@/features/dashboard/components/nav-secondary"
import { NavUser } from "@/features/dashboard/components/nav-user"
import { sidebarData } from "@features/dashboard/constants/sidebar-data"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { TerminalIcon } from "lucide-react"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: User
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const currentUser = {
    name: user?.name ?? sidebarData.user.name,
    email: user?.email ?? sidebarData.user.email,
    avatar: user?.image ?? sidebarData.user.avatar,
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <TerminalIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Manused</span>
                <span className="truncate text-xs">Manunggal Sedyo</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavProjects projects={sidebarData.projects} />
        <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
