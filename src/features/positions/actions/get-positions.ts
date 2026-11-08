"use server"

import prisma from "@/lib/prisma"
import { auth } from "@features/auth/lib/auth"

export interface GetPositionsResult {
  success: boolean
  data?: Awaited<ReturnType<typeof prisma.position.findMany>>
  error?: string
}

export async function getPositions(): Promise<GetPositionsResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const positions = await prisma.position.findMany({
      orderBy: { rank: "asc" },
    })
    return { success: true, data: positions }
  } catch (error) {
    console.error("Failed to fetch positions:", error)
    return { success: false, error: "Gagal memuat data jabatan" }
  }
}
