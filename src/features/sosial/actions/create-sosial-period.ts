"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { createSosialPeriodSchema, getSosialPeriodFormValues } from "../sosial-schemas"
import { revalidatePath } from "next/cache"

export async function createSosialPeriod(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getSosialPeriodFormValues(formData)
  const validation = createSosialPeriodSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    await prisma.sosialPeriod.create({
      data: {
        month: validation.data.month,
        year: validation.data.year,
        minAmount: validation.data.minAmount,
        createdById: session.user.id,
      },
    })

    revalidatePath("/dashboard/sosial")
    return { success: true }
  } catch (error) {
    console.error("Failed to create sosial period:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2002") {
      return { error: "Periode untuk bulan ini sudah ada" }
    }

    return { error: "Gagal membuat periode sosial" }
  }
}
