"use server"

import prisma from "@/lib/prisma"
import { auth, signOut } from "@/features/auth/lib/auth"
import { logActivity } from "@/features/log/activity-log"

export async function logoutAction() {
  const session = await auth()

  if (session?.user?.id) {
    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "LOGOUT",
      entity: "auth",
      summary: "Keluar dari aplikasi",
    })
  }

  await signOut({ redirectTo: "/signin" })
}
