"use server"

import prisma from "@/lib/prisma"

export interface GetMembersResult {
  success: boolean
  data?: Awaited<ReturnType<typeof prisma.member.findMany>>
  error?: string
}

export async function getMembers(): Promise<GetMembersResult> {
  try {
    const members = await prisma.member.findMany({
      orderBy: { createdAt: "desc" },
    })
    return { success: true, data: members }
  } catch (error) {
    console.error("Failed to fetch members:", error)
    return { success: false, error: "Gagal memuat data anggota" }
  }
}
