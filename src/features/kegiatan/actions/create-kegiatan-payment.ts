"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import {
  createKegiatanPaymentSchema,
  getKegiatanPaymentFormValues,
} from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function createKegiatanPayment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getKegiatanPaymentFormValues(formData)
  const validation = createKegiatanPaymentSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  const { kegiatanId, memberId, amount, paidAt, note } = validation.data

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: kegiatanId },
    })

    if (!kegiatan) {
      return { error: "Kegiatan tidak ditemukan atau sudah dihapus" }
    }

    // Peserta wajib terdaftar dulu sebelum bisa bayar.
    const participant = await prisma.kegiatanParticipant.findUnique({
      where: { kegiatanId_memberId: { kegiatanId, memberId } },
    })

    if (!participant) {
      return { error: "Anggota ini belum terdaftar sebagai peserta kegiatan" }
    }

    const id = crypto.randomUUID()
    await prisma.$transaction([
      prisma.kegiatanPayment.create({
        data: {
          id,
          kegiatanId,
          memberId,
          amount,
          paidAt,
          note: note ?? null,
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
          entity: "kegiatanPayment",
          entityId: id,
          summary: `Mencatat pembayaran kegiatan ${kegiatan.name}`,
          after: {
            kegiatanId,
            memberId,
            amount,
            paidAt: paidAt.toISOString(),
            note: note ?? null,
          },
        }),
      }),
    ])

    revalidatePath(`/dashboard/kegiatan/${kegiatanId}`)
    return { success: true }
  }
  catch (error) {
    console.error("Failed to create kegiatan payment:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2003") {
      return { error: "Data kegiatan atau anggota tidak valid" }
    }

    return { error: "Gagal mencatat pembayaran" }
  }
}
