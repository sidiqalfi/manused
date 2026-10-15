import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/features/auth/lib/auth"

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith("/dashboard")) return NextResponse.next()

  const session = await auth()

  if (session) return NextResponse.next()

  // Belum login: otomatis masuk sebagai tamu, lalu kembali ke URL tujuan —
  // link /dashboard/... yang dibagikan terbuka tanpa langkah login manual.
  const url = req.nextUrl.clone()
  url.pathname = "/api/auth/guest-redirect"
  url.search = `?to=${encodeURIComponent(pathname + req.nextUrl.search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
