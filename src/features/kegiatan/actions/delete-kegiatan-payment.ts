"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import { kegiatanPaymentIdSchema } from "../kegiatan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function deleteKegiatanPayment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const validation = kegiatanPaymentIdSchema.safeParse(formData.get("id"))
  if (!validation.success) {
    return { error: "Data tidak valid" }
  }

  try {
    const payment = await prisma.kegiatanPayment.findUnique({
      where: { id: validation.data },
    })

    if (!payment) {
      return { error: "Pembayaran tidak ditemukan atau sudah dihapus" }
    }

    if (payment.createdById !== session.user.id) {
      return { error: "Anda tidak memiliki izin untuk menghapus pembayaran ini" }
    }

    await prisma.$transaction([
      prisma.kegiatanPayment.delete({
        where: { id: validation.data },
      }),
      prisma.kegiatan.update({
        where: { id: payment.kegiatanId },
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
          entity: "kegiatanPayment",
          entityId: validation.data,
          summary: "Menghapus pembayaran kegiatan",
          before: {
            kegiatanId: payment.kegiatanId,
            memberId: payment.memberId,
            amount: payment.amount,
            paidAt: payment.paidAt.toISOString(),
          },
        }),
      }),
    ])

    revalidatePath(`/dashboard/kegiatan/${payment.kegiatanId}`)
    return { success: true }
  }
  catch (error) {
    console.error("Failed to delete kegiatan payment:", error)
    return { error: "Gagal menghapus pembayaran" }
  }
}
