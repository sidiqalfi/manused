"use server"

import prisma from "@/lib/prisma"
import { auth } from "@features/auth/lib/auth"

export interface GetRolesResult {
  success: boolean
  data?: Awaited<ReturnType<typeof prisma.role.findMany>>
  error?: string
}

export async function getRoles(): Promise<GetRolesResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const roles = await prisma.role.findMany({
      orderBy: { rank: "asc" },
    })
    return { success: true, data: roles }
  } catch (error) {
    console.error("Failed to fetch roles:", error)
    return { success: false, error: "Gagal memuat data role" }
  }
}
