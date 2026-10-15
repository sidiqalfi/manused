import { NextResponse, type NextRequest } from "next/server"
import { auth, signIn } from "@/features/auth/lib/auth"
import { AuthError } from "next-auth"

/**
 * Auto-guest: dipanggil proxy saat pengunjung tanpa sesi membuka link
 * /dashboard/... — langsung di-signin sebagai tamu lalu dilempar balik
 * ke URL tujuan, jadi link yang dibagikan terbuka tanpa langkah tambahan.
 */
export async function GET(req: NextRequest) {
  // Sudah ada sesi (mis. tab lain baru login) → balik ke tujuan saja.
  const session = await auth()
  if (session) {
    return redirectToTarget(req)
  }

  try {
    await signIn("guest", { redirect: false })
  } catch (error) {
    if (error instanceof AuthError) {
      const url = req.nextUrl.clone()
      url.pathname = "/signin"
      url.search = ""
      return NextResponse.redirect(url)
    }
    throw error
  }

  return redirectToTarget(req)
}

function redirectToTarget(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("to") ?? "/dashboard"

  // Anti open-redirect: hanya path internal yang diizinkan.
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  const target = new URL(raw, req.url)
  return NextResponse.redirect(target)
}
