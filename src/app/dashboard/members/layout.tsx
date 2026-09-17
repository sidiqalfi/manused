import { redirect } from "next/navigation"
import { auth } from "@/features/auth/lib/auth"

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (session?.user?.role === "guest") {
    redirect("/dashboard")
  }

  return <>{children}</>
}
