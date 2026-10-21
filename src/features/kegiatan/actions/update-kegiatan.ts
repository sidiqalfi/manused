"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import {
  updateKegiatanSchema,
  getUpdateKegiatanFormValues,
} from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function updateKegiatan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getUpdateKegiatanFormValues(formData)
  const validation = updateKegiatanSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  const { id, slug, ...updates } = validation.data

  try {
    const existing = await prisma.kegiatan.findUnique({ where: { id } })

    if (!existing) {
      return { error: "Kegiatan tidak ditemukan atau sudah dihapus" }
    }

    if (existing.createdById !== session.user.id) {
      return { error: "Anda tidak memiliki izin untuk mengubah kegiatan ini" }
    }

    // Slug hanya diubah jika dikirim dan benar-benar beda; tolak jika
    // sudah dipakai kegiatan lain.
    let nextSlug: string | undefined
    if (slug !== undefined && slug !== null && slug !== "" && slug !== existing.slug) {
      const clash = await prisma.kegiatan.findUnique({ where: { slug } })
      if (clash) {
        return { error: "Slug sudah dipakai kegiatan lain" }
      }
      nextSlug = slug
    }

    const kegiatan = await prisma.kegiatan.update({
      where: { id },
      data: {
        ...(nextSlug !== undefined && { slug: nextSlug }),
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.eventDate !== undefined && { eventDate: updates.eventDate }),
        ...(updates.location !== undefined && { location: updates.location }),
        ...(updates.feePerPerson !== undefined && { feePerPerson: updates.feePerPerson }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.note !== undefined && { note: updates.note }),
        updatedAt: new Date(),
      },
    })

    await prisma.activityLog.create({
      data: activityLogData({
        actor: {
          id: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email ?? null,
        },
        action: "UPDATE",
        entity: "kegiatan",
        entityId: id,
        summary: `Mengubah kegiatan ${existing.name}`,
        before: {
          name: existing.name,
          slug: existing.slug,
          eventDate: existing.eventDate.toISOString(),
          location: existing.location,
          feePerPerson: existing.feePerPerson,
          status: existing.status,
          note: existing.note,
        },
        after: {
          name: kegiatan.name,
          slug: kegiatan.slug,
          eventDate: kegiatan.eventDate.toISOString(),
          location: kegiatan.location,
          feePerPerson: kegiatan.feePerPerson,
          status: kegiatan.status,
          note: kegiatan.note,
        },
      }),
    })

    revalidatePath("/dashboard/kegiatan", "layout")
    return { success: true }
  }
  catch (error) {
    console.error("Failed to update kegiatan:", error)
    return { error: "Gagal mengubah kegiatan" }
  }
}
