"use server"

import prisma from "@/lib/prisma"
import { auth } from "@features/auth/lib/auth"
import { isGuestSession } from "@/features/auth/lib/guards"

export interface ProfileData {
  id: string
  name: string | null
  email: string
  role: "user" | "guest"
  createdAt: Date
}

export interface GetProfileResult {
  success: boolean
  data?: ProfileData
  error?: string
}

export async function getProfile(): Promise<GetProfileResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  // Sesi tamu: id-nya pseudo (tidak ada di tabel User), cukup dari session.
  if (isGuestSession(session)) {
    return {
      success: true,
      data: {
        id: session.user.id,
        name: session.user.name ?? "Tamu",
        email: session.user.email ?? "",
        role: "guest",
        createdAt: new Date(0),
      },
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    if (!user) {
      return { success: false, error: "User tidak ditemukan" }
    }

    return {
      success: true,
      data: { ...user, role: "user" },
    }
  } catch {
    return { success: false, error: "Gagal memuat profil" }
  }
}
