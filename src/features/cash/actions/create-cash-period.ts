"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { createCashPeriodSchema, getCashPeriodFormValues } from "../cash-schemas"
import { logActivity } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function createCashPeriod(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getCashPeriodFormValues(formData)
  const validation = createCashPeriodSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    const id = crypto.randomUUID()
    await prisma.cashPeriod.create({
      data: {
        id,
        month: validation.data.month,
        year: validation.data.year,
        duesAmount: validation.data.duesAmount,
        minAmount: validation.data.minAmount,
        createdById: session.user.id,
      },
    })

    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "CREATE",
      entity: "cashPeriod",
      entityId: id,
      summary: "Membuat periode kas",
      after: {
        month: validation.data.month,
        year: validation.data.year,
        duesAmount: validation.data.duesAmount,
        minAmount: validation.data.minAmount,
      },
    })

    revalidatePath("/dashboard/cash")
    return { success: true }
  } catch (error) {
    console.error("Failed to create cash period:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2002") {
      return { error: "Periode untuk bulan ini sudah ada" }
    }

    return { error: "Gagal membuat periode kas" }
  }
}
