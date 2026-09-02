"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import {
  SOSIAL_INITIAL_BALANCE_KEY,
  initialBalanceSchema,
  getInitialBalanceFormValues,
} from "../sosial-schemas"
import { revalidatePath } from "next/cache"

export async function setSosialInitialBalance(formData: FormData) {
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
      where: { key: SOSIAL_INITIAL_BALANCE_KEY },
      create: { key: SOSIAL_INITIAL_BALANCE_KEY, value: String(validation.data) },
      update: { value: String(validation.data) },
    })

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to set sosial initial balance:", error)
    return { error: "Gagal menyimpan saldo awal" }
  }
}
