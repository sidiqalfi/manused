"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { createCashPeriodSchema, getCashPeriodFormValues } from "../cash-schemas"
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
    await prisma.cashPeriod.create({
      data: {
        month: validation.data.month,
        year: validation.data.year,
        duesAmount: validation.data.duesAmount,
        minAmount: validation.data.minAmount,
        createdById: session.user.id,
      },
    })

    revalidatePath("/dashboard/cash")
    return { success: true }
  } catch (error) {
    console.error("Failed to create cash period:", error)
    return { error: "Gagal membuat periode kas" }
  }
}
