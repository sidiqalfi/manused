"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import {
  removeKegiatanParticipantSchema,
  getRemoveParticipantFormValues,
} from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function removeKegiatanParticipant(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getRemoveParticipantFormValues(formData)
  const validation = removeKegiatanParticipantSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid" }
  }

  const { kegiatanId, memberId } = validation.data

  try {
    const participant = await prisma.kegiatanParticipant.findUnique({
      where: { kegiatanId_memberId: { kegiatanId, memberId } },
      include: { member: { select: { name: true } } },
    })

    if (!participant) {
      return { error: "Peserta tidak ditemukan" }
    }

    await prisma.$transaction([
      prisma.kegiatanParticipant.delete({
        where: { kegiatanId_memberId: { kegiatanId, memberId } },
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
          action: "DELETE",
          entity: "kegiatanParticipant",
          entityId: participant.id,
          summary: `Menghapus peserta ${participant.member.name} dari kegiatan`,
          before: { kegiatanId, memberId },
        }),
      }),
    ])

    revalidatePath("/dashboard/kegiatan", "layout")
    return { success: true }
  }
  catch (error) {
    console.error("Failed to remove kegiatan participant:", error)
    return { error: "Gagal menghapus peserta" }
  }
}
