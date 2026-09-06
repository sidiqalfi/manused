"use server"

import prisma from "@/lib/prisma"

export interface ActivityLogActorOption {
  id: string | null
  name: string | null
  email: string | null
}

export interface GetActivityLogActorsResult {
  success: boolean
  data?: ActivityLogActorOption[]
  error?: string
}

export async function getActivityLogActors(): Promise<GetActivityLogActorsResult> {
  try {
    const groups = await prisma.activityLog.groupBy({
      by: ["actorId", "actorName", "actorEmail"],
      orderBy: { actorId: "desc" },
    })

    return {
      success: true,
      data: groups.map((g) => ({
        id: g.actorId,
        name: g.actorName,
        email: g.actorEmail,
      })),
    }
  } catch (error) {
    console.error("Failed to fetch activity log actors:", error)
    return { success: false, error: "Gagal memuat daftar aktor" }
  }
}
