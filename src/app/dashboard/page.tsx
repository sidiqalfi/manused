import { auth, signOut } from "@/features/auth/lib/auth"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await auth()

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>{session.user?.email}</p>

      <form action={async() => {
        "use server"
        await signOut()
      }}>
        <button>Logout</button>
      </form>
    </div>
  )
}