"use server"

import prisma from "@/lib/prisma"
import { auth } from "@features/auth/lib/auth"

export interface GetMembersResult {
  success: boolean
  data?: Awaited<ReturnType<typeof prisma.member.findMany>>
  error?: string
}

export async function getMembers(): Promise<GetMembersResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const members = await prisma.member.findMany({
      // Urut abjad agar dropdown/picker nama di semua form mudah dipilih.
      orderBy: { name: "asc" },
    })
    return { success: true, data: members }
  } catch (error) {
    console.error("Failed to fetch members:", error)
    return { success: false, error: "Gagal memuat data anggota" }
  }
}
