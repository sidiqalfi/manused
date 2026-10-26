"use server"

import { headers } from "next/headers"
import { signIn } from "@/features/auth/lib/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"

export async function guestLoginAction(
  _prevState: string | null,
  _formData: FormData
): Promise<string | null> {
  // Rate limit per IP: 5 sesi tamu per menit (cegah flood log aktivitas).
  const hdrs = await headers()
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown"
  const limited = rateLimit(`guest:${ip}`, { limit: 5, windowMs: 60 * 1000 })
  if (!limited.ok) {
    return "Terlalu banyak percobaan. Coba lagi sebentar."
  }

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
