"use server"

import prisma from "@/lib/prisma"

export interface GetRolesResult {
  success: boolean
  data?: Awaited<ReturnType<typeof prisma.role.findMany>>
  error?: string
}

export async function getRoles(): Promise<GetRolesResult> {
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
