"use server"

import prisma from "@/lib/prisma"
import { CASH_INITIAL_BALANCE_KEY } from "../cash-schemas"
import { auth } from "@features/auth/lib/auth"

export interface InitialBalanceData {
  initialBalance: number
}

export interface GetInitialBalanceResult {
  success: boolean
  data?: InitialBalanceData
  error?: string
}

export async function getCashInitialBalance(): Promise<GetInitialBalanceResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: CASH_INITIAL_BALANCE_KEY },
    })

    const initialBalance = setting ? Number(setting.value) : 0

    return { success: true, data: { initialBalance } }
  } catch (error) {
    console.error("Failed to fetch cash initial balance:", error)
    return { success: false, error: "Gagal memuat saldo awal" }
  }
}
