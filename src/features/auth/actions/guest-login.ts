"use server"

import { signIn } from "@/features/auth/lib/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

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

  redirect("/dashboard")
}
