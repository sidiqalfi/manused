"use server"

import prisma from "@/lib/prisma"
import { ARISAN_INITIAL_SAVE_KEY } from "../arisan-schemas"

export interface InitialSaveData {
  initialSave: number
}

export interface GetInitialSaveResult {
  success: boolean
  data?: InitialSaveData
  error?: string
}

export async function getInitialSave(): Promise<GetInitialSaveResult> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: ARISAN_INITIAL_SAVE_KEY },
    })

    const initialSave = setting ? Number(setting.value) : 0

    return { success: true, data: { initialSave } }
  } catch (error) {
    console.error("Failed to fetch initial save:", error)
    return { success: false, error: "Gagal memuat saldo awal" }
  }
}
