"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { createArisanPeriodSchema, getArisanPeriodFormValues } from "../arisan-schemas"
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
    await prisma.arisanPeriod.create({
      data: {
        month: validation.data.month,
        year: validation.data.year,
        contributionAmount: validation.data.contributionAmount,
        payoutTarget: validation.data.payoutTarget,
        createdById: session.user.id,
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
