"use server"

import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { kegiatanIdSchema } from "../kegiatan-schemas"

const kegiatanDetailsInclude = {
  participants: {
    include: {
      member: {
        select: { id: true, name: true, fullName: true, status: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  },
  payments: {
    include: {
      member: {
        select: { id: true, name: true, fullName: true },
      },
    },
    orderBy: { paidAt: "asc" },
  },
  expenses: {
    orderBy: { spentAt: "asc" },
  },
  relatedCashExpenses: {
    include: {
      period: { select: { id: true, month: true, year: true } },
    },
    orderBy: { spentAt: "asc" },
  },
} satisfies Prisma.KegiatanInclude

export type KegiatanWithDetails = Prisma.KegiatanGetPayload<{
  include: typeof kegiatanDetailsInclude
}>

export interface GetKegiatanDetailResult {
  success: boolean
  data?: KegiatanWithDetails
  error?: string
}

export async function getKegiatanDetail(
  kegiatanId: string
): Promise<GetKegiatanDetailResult> {
  const validation = kegiatanIdSchema.safeParse(kegiatanId)
  if (!validation.success) {
    return { success: false, error: "ID kegiatan tidak valid" }
  }

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: validation.data },
      include: kegiatanDetailsInclude,
    })

    if (!kegiatan) {
      return { success: false, error: "Kegiatan tidak ditemukan" }
    }

    return { success: true, data: kegiatan }
  }
  catch (error) {
    console.error("Failed to fetch kegiatan detail:", error)
    return { success: false, error: "Gagal memuat data kegiatan" }
  }
}
