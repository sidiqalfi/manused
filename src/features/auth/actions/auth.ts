"use server"

import { signIn } from "@/features/auth/lib/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export async function loginAction(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
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
