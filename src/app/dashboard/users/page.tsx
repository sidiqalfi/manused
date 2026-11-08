import { redirect } from "next/navigation"
import { auth } from "@/features/auth/lib/auth"
import { getAdministrator } from "@/features/auth/lib/administrator"
import { UsersView } from "@/features/users/components/users-view"

export default async function UsersPage() {
  const administrator = await getAdministrator(await auth())
  if (!administrator) redirect("/dashboard")
  return <UsersView currentUserId={administrator.id} />
}
