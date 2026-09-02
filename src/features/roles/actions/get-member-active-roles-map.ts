"use server"

import prisma from "@/lib/prisma"

export interface ActiveRole {
  id: string
  name: string
  rank: number
}

export type MemberActiveRolesMap = Record<string, ActiveRole[]>

export interface GetMemberActiveRolesMapResult {
  success: boolean
  data?: MemberActiveRolesMap
  error?: string
}

export async function getMemberActiveRolesMap(): Promise<GetMemberActiveRolesMapResult> {
  try {
    const assignments = await prisma.memberRoleAssignment.findMany({
      where: { endDate: null },
      include: { role: true },
    })

    const map: MemberActiveRolesMap = {}
    for (const a of assignments) {
      const bucket = map[a.memberId] ?? []
      bucket.push({ id: a.role.id, name: a.role.name, rank: a.role.rank })
      map[a.memberId] = bucket
    }
    for (const key of Object.keys(map)) {
      map[key]!.sort((x, y) => x.rank - y.rank)
    }

    return { success: true, data: map }
  } catch (error) {
    console.error("Failed to fetch member active roles:", error)
    return { success: false, error: "Gagal memuat data role anggota" }
  }
}
