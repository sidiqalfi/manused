"use server"

import { headers } from "next/headers"
import { signIn } from "@/features/auth/lib/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { rateLimit } from "@/lib/rate-limit"

export async function loginAction(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  // Rate limit per IP: 10 percobaan per 5 menit.
  const hdrs = await headers()
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown"
  const limited = rateLimit(`login:${ip}`, {
    limit: 10,
    windowMs: 5 * 60 * 1000,
  })
  if (!limited.ok) {
    return `Terlalu banyak percobaan. Coba lagi dalam ${limited.retryAfterSeconds} detik.`
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Email atau password salah."
        default:
          return "Terjadi kesalahan. Coba lagi."
      }
    }
    throw error
  }

  redirect("/dashboard")
}
