"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import { kegiatanIdSchema } from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function deleteKegiatan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const validation = kegiatanIdSchema.safeParse(formData.get("id"))
  if (!validation.success) {
    return { error: "Data tidak valid" }
  }

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: validation.data },
    })

    if (!kegiatan) {
      return { error: "Kegiatan tidak ditemukan atau sudah dihapus" }
    }

    if (kegiatan.createdById !== session.user.id) {
      return { error: "Anda tidak memiliki izin untuk menghapus kegiatan ini" }
    }

    await prisma.$transaction([
      prisma.kegiatan.delete({
        where: { id: validation.data },
      }),
      prisma.activityLog.create({
        data: activityLogData({
          actor: {
            id: session.user.id,
            name: session.user.name ?? null,
            email: session.user.email ?? null,
          },
          action: "DELETE",
          entity: "kegiatan",
          entityId: validation.data,
          summary: `Menghapus kegiatan ${kegiatan.name}`,
          before: {
            name: kegiatan.name,
            eventDate: kegiatan.eventDate.toISOString(),
            feePerPerson: kegiatan.feePerPerson,
            status: kegiatan.status,
          },
        }),
      }),
    ])

    revalidatePath("/dashboard/kegiatan")
    return { success: true }
  }
  catch (error) {
    console.error("Failed to delete kegiatan:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2003") {
      return { error: "Kegiatan masih memiliki data terkait" }
    }

    return { error: "Gagal menghapus kegiatan" }
  }
}
