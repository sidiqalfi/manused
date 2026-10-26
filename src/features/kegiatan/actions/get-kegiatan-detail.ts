"use server"

import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { kegiatanIdSchema } from "../kegiatan-schemas"
import { auth } from "@features/auth/lib/auth"

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
  slugOrId: string
): Promise<GetKegiatanDetailResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  // Terima slug URL maupun uuid lama (link lama tetap hidup).
  const isUuid = kegiatanIdSchema.safeParse(slugOrId).success
  if (!isUuid && !/^[a-z0-9](-?[a-z0-9])*$/.test(slugOrId)) {
    return { success: false, error: "Link kegiatan tidak valid" }
  }

  try {
    const kegiatan = await prisma.kegiatan.findFirst({
      where: isUuid
        ? { OR: [{ id: slugOrId }, { slug: slugOrId }] }
        : { slug: slugOrId },
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
