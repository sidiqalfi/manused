"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import {
  updateKegiatanParticipantSchema,
  getUpdateParticipantFormValues,
} from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function updateKegiatanParticipant(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getUpdateParticipantFormValues(formData)
  const validation = updateKegiatanParticipantSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  const { kegiatanId, memberId, attending, expectedAmount } = validation.data

  try {
    const participant = await prisma.kegiatanParticipant.findUnique({
      where: { kegiatanId_memberId: { kegiatanId, memberId } },
      include: {
        kegiatan: { select: { id: true, name: true, createdById: true } },
        member: { select: { id: true, name: true } },
      },
    })

    if (!participant) {
      return { error: "Peserta tidak ditemukan di kegiatan ini" }
    }
    if (participant.kegiatan.createdById !== session.user.id) {
      return { error: "Anda tidak memiliki izin mengubah kegiatan ini" }
    }

    // null = kembali ke feePerPerson kegiatan.
    const nextExpectedAmount = expectedAmount ?? null

    await prisma.$transaction([
      prisma.kegiatanParticipant.update({
        where: { id: participant.id },
        data: { attending, expectedAmount: nextExpectedAmount },
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
          action: "UPDATE",
          entity: "kegiatanParticipant",
          entityId: participant.id,
          summary: `Mengubah peserta ${participant.member.name} pada kegiatan ${participant.kegiatan.name}`,
          before: {
            attending: participant.attending,
            expectedAmount: participant.expectedAmount,
          },
          after: { attending, expectedAmount: nextExpectedAmount },
        }),
      }),
    ])

    revalidatePath("/dashboard/kegiatan", "layout")
    return { success: true }
  }
  catch (error) {
    console.error("Failed to update kegiatan participant:", error)
    return { error: "Gagal mengubah peserta" }
  }
}
