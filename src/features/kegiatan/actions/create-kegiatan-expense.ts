"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import {
  createKegiatanExpenseSchema,
  getKegiatanExpenseFormValues,
} from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function createKegiatanExpense(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getKegiatanExpenseFormValues(formData)
  const validation = createKegiatanExpenseSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  const { kegiatanId, description, amount, spentAt } = validation.data

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: kegiatanId },
    })

    if (!kegiatan) {
      return { error: "Kegiatan tidak ditemukan atau sudah dihapus" }
    }

    const id = crypto.randomUUID()
    await prisma.$transaction([
      prisma.kegiatanExpense.create({
        data: {
          id,
          kegiatanId,
          description,
          amount,
          spentAt,
          createdById: session.user.id,
        },
      }),
      prisma.kegiatan.update({
        where: { id: kegiatanId },
        data: { updatedAt: new Date() },
      }),
      prisma.activityLog.create({
        data: activityLogData({
          actor: {
            id: session.user.id,
            name: session.user.name ?? null,
            email: session.user.email ?? null,
          },
          action: "CREATE",
          entity: "kegiatanExpense",
          entityId: id,
          summary: `Mencatat pengeluaran kegiatan ${kegiatan.name}`,
          after: {
            kegiatanId,
            description,
            amount,
            spentAt: spentAt.toISOString(),
          },
        }),
      }),
    ])

    revalidatePath(`/dashboard/kegiatan/${kegiatanId}`)
    return { success: true }
  }
  catch (error) {
    console.error("Failed to create kegiatan expense:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2003") {
      return { error: "Data kegiatan tidak valid" }
    }

    return { error: "Gagal mencatat pengeluaran" }
  }
}
