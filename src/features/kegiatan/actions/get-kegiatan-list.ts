"use server"

import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"

const kegiatanListInclude = {
  _count: { select: { participants: true } },
  payments: { select: { amount: true } },
  expenses: { select: { amount: true } },
} satisfies Prisma.KegiatanInclude

type KegiatanWithAggregates = Prisma.KegiatanGetPayload<{
  include: typeof kegiatanListInclude
}>

export interface GetKegiatanListResult {
  success: boolean
  data?: KegiatanWithAggregates[]
  error?: string
}

export async function getKegiatanList(): Promise<GetKegiatanListResult> {
  try {
    const kegiatan = await prisma.kegiatan.findMany({
      orderBy: { eventDate: "desc" },
      include: kegiatanListInclude,
    })
    return { success: true, data: kegiatan }
  }
  catch (error) {
    console.error("Failed to fetch kegiatan list page:", error)
    return { success: false, error: "Gagal memuat daftar kegiatan" }
  }
}
