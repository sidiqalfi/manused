"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import {
  addKegiatanParticipantsBatchSchema,
  getAddParticipantsFormValues,
} from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function addKegiatanParticipants(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getAddParticipantsFormValues(formData)
  const validation = addKegiatanParticipantsBatchSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  const { kegiatanId, memberIds } = validation.data

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: kegiatanId },
    })

    if (!kegiatan) {
      return { error: "Kegiatan tidak ditemukan atau sudah dihapus" }
    }

    // Buang member yang sudah terdaftar (guard race dengan unique constraint).
    const existing = await prisma.kegiatanParticipant.findMany({
      where: { kegiatanId, memberId: { in: memberIds } },
      select: { memberId: true },
    })
    const existingIds = new Set(existing.map((p) => p.memberId))
    const newIds = memberIds.filter((id) => !existingIds.has(id))

    if (newIds.length === 0) {
      return { success: true, count: 0 }
    }

    const entries = newIds.map((memberId) => ({
      id: crypto.randomUUID(),
      memberId,
    }))

    await prisma.$transaction([
      prisma.kegiatanParticipant.createMany({
        data: entries.map((entry) => ({
          id: entry.id,
          kegiatanId,
          memberId: entry.memberId,
          createdById: session.user.id,
        })),
      }),
      prisma.kegiatan.update({
        where: { id: kegiatanId },
        data: { updatedAt: new Date() },
      }),
      ...entries.map((entry) =>
        prisma.activityLog.create({
          data: activityLogData({
            actor: {
              id: session.user.id,
              name: session.user.name ?? null,
              email: session.user.email ?? null,
            },
            action: "CREATE",
            entity: "kegiatanParticipant",
            entityId: entry.id,
            summary: `Menambah peserta kegiatan ${kegiatan.name}`,
            after: { kegiatanId, memberId: entry.memberId },
          }),
        }),
      ),
    ])

    revalidatePath(`/dashboard/kegiatan/${kegiatanId}`)
    return { success: true, count: entries.length }
  }
  catch (error) {
    console.error("Failed to add kegiatan participants:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2002") {
      return { error: "Ada anggota yang sudah terdaftar" }
    }
    if (prismaError.code === "P2003") {
      return { error: "Data kegiatan atau anggota tidak valid" }
    }

    return { error: "Gagal menambah peserta" }
  }
}
