"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import {
  CASH_INITIAL_BALANCE_KEY,
  initialBalanceSchema,
  getInitialBalanceFormValues,
} from "../cash-schemas"
import { revalidatePath } from "next/cache"

export async function setCashInitialBalance(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getInitialBalanceFormValues(formData)
  const validation = initialBalanceSchema.safeParse(data.initialBalance)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    await prisma.appSetting.upsert({
      where: { key: CASH_INITIAL_BALANCE_KEY },
      create: { key: CASH_INITIAL_BALANCE_KEY, value: String(validation.data) },
      update: { value: String(validation.data) },
    })

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to set cash initial balance:", error)
    return { error: "Gagal menyimpan saldo awal" }
  }
}
