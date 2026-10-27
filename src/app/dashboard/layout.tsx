import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/features/dashboard/components/app-sidebar"
import { DashboardBreadcrumb } from "@/features/dashboard/components/dashboard-breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { auth } from "@/features/auth/lib/auth"
import { GuestProvider } from "@/features/auth/components/guest-context"
import { redirect } from "next/navigation"
import { gravatarUrl } from "@/lib/gravatar"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) {
    redirect("/signin")
  }

  // Tamu tidak punya email terdaftar; Gravatar hanya untuk pengguna.
  const avatarUrl =
    session.user?.role !== "guest" && session.user?.email
      ? gravatarUrl(session.user.email)
      : null

  return (
    <GuestProvider isGuest={session.user?.role === "guest"}>
    <SidebarProvider defaultOpen={true}>
      <AppSidebar user={session.user} avatarUrl={avatarUrl} />
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-8">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <DashboardBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
    </GuestProvider>
  )
}