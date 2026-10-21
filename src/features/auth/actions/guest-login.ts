"use server"

import { signIn } from "@/features/auth/lib/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export async function guestLoginAction(
  _prevState: string | null,
  _formData: FormData
): Promise<string | null> {
  try {
    await signIn("guest", { redirect: false })
  } catch (error) {
    if (error instanceof AuthError) {
      return "Gagal masuk sebagai tamu. Coba lagi."
    }
    throw error
  }

  // Tamu tidak punya user id, jadi entry tanpa actor
  // (activityLogData menuntut actor, jadi create langsung).
  try {
    await prisma.activityLog.create({
      data: {
        actorId: null,
        actorName: "Tamu",
        actorEmail: null,
        action: "LOGIN",
        entity: "guestSession",
        entityId: null,
        summary: "Seorang tamu masuk ke dashboard",
      },
    })
  } catch (error) {
    // Log best-effort — jangan gagalkan login karena log.
    console.error("Failed to log guest login:", error)
  }

  redirect("/dashboard")
}
