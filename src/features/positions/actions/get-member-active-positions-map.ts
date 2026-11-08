"use server"

import prisma from "@/lib/prisma"
import { auth } from "@features/auth/lib/auth"

export interface ActivePosition {
  id: string
  name: string
  rank: number
}

export type MemberActivePositionsMap = Record<string, ActivePosition[]>

export interface GetMemberActivePositionsMapResult {
  success: boolean
  data?: MemberActivePositionsMap
  error?: string
}

export async function getMemberActivePositionsMap(): Promise<GetMemberActivePositionsMapResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const assignments = await prisma.memberPositionAssignment.findMany({
      where: { endDate: null },
      include: { position: true },
    })

    const map: MemberActivePositionsMap = {}
    for (const a of assignments) {
      const bucket = map[a.memberId] ?? []
      bucket.push({ id: a.position.id, name: a.position.name, rank: a.position.rank })
      map[a.memberId] = bucket
    }
    for (const key of Object.keys(map)) {
      map[key]!.sort((x, y) => x.rank - y.rank)
    }

    return { success: true, data: map }
  } catch (error) {
    console.error("Failed to fetch member active positions:", error)
    return { success: false, error: "Gagal memuat data jabatan anggota" }
  }
}
