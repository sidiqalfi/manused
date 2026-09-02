"use server"

import prisma from "@/lib/prisma"
import { SOSIAL_INITIAL_BALANCE_KEY } from "../sosial-schemas"

export interface InitialBalanceData {
  initialBalance: number
}

export interface GetInitialBalanceResult {
  success: boolean
  data?: InitialBalanceData
  error?: string
}

export async function getSosialInitialBalance(): Promise<GetInitialBalanceResult> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: SOSIAL_INITIAL_BALANCE_KEY },
    })

    const initialBalance = setting ? Number(setting.value) : 0

    return { success: true, data: { initialBalance } }
  } catch (error) {
    console.error("Failed to fetch sosial initial balance:", error)
    return { success: false, error: "Gagal memuat saldo awal" }
  }
}
