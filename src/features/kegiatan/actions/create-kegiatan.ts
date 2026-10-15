"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import {
  createKegiatanSchema,
  getCreateKegiatanFormValues,
} from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function createKegiatan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getCreateKegiatanFormValues(formData)
  const validation = createKegiatanSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    const id = crypto.randomUUID()
    await prisma.$transaction([
      prisma.kegiatan.create({
        data: {
          id,
          name: validation.data.name,
          eventDate: validation.data.eventDate,
          location: validation.data.location ?? null,
          feePerPerson: validation.data.feePerPerson,
          status: validation.data.status,
          note: validation.data.note ?? null,
          createdById: session.user.id,
        },
      }),
      prisma.activityLog.create({
        data: activityLogData({
          actor: {
            id: session.user.id,
            name: session.user.name ?? null,
            email: session.user.email ?? null,
          },
          action: "CREATE",
          entity: "kegiatan",
          entityId: id,
          summary: `Membuat kegiatan ${validation.data.name}`,
          after: {
            name: validation.data.name,
            eventDate: validation.data.eventDate.toISOString(),
            location: validation.data.location ?? null,
            feePerPerson: validation.data.feePerPerson,
            status: validation.data.status,
          },
        }),
      }),
    ])

    revalidatePath("/dashboard/kegiatan")
    return { success: true, id }
  }
  catch (error) {
    console.error("Failed to create kegiatan:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2003") {
      return { error: "Data kegiatan tidak valid" }
    }

    return { error: "Gagal membuat kegiatan" }
  }
}
