"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { createArisanPeriodSchema, getArisanPeriodFormValues } from "../arisan-schemas"
import { logActivity } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function createArisanPeriod(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getArisanPeriodFormValues(formData)
  const validation = createArisanPeriodSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    const id = crypto.randomUUID()
    await prisma.arisanPeriod.create({
      data: {
        id,
        month: validation.data.month,
        year: validation.data.year,
        contributionAmount: validation.data.contributionAmount,
        payoutTarget: validation.data.payoutTarget,
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
      entity: "arisanPeriod",
      entityId: id,
      summary: "Membuat periode arisan",
      after: {
        month: validation.data.month,
        year: validation.data.year,
        contributionAmount: validation.data.contributionAmount,
        payoutTarget: validation.data.payoutTarget,
      },
    })

    revalidatePath("/dashboard/arisan")
    return { success: true }
  } catch (error) {
    console.error("Failed to create arisan period:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2002") {
      return { error: "Periode untuk bulan ini sudah ada" }
    }

    return { error: "Gagal membuat periode arisan" }
  }
}
