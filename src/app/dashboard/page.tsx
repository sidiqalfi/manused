import { redirect } from "next/navigation"
import { auth } from "@/features/auth/lib/auth"
import { DashboardView } from "@/features/dashboard/components/dashboard-view"

export default async function Page() {
  const session = await auth()
  if (!session) {
    redirect("/signin")
  }

  return <DashboardView userName={session.user?.name ?? null} />
}
