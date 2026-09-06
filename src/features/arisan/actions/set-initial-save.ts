"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import {
  ARISAN_INITIAL_SAVE_KEY,
  initialSaveSchema,
  getInitialSaveFormValues,
} from "../arisan-schemas"
import { logActivity } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function setInitialSave(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const data = getInitialSaveFormValues(formData)
  const validation = initialSaveSchema.safeParse(data.initialSave)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    await prisma.appSetting.upsert({
      where: { key: ARISAN_INITIAL_SAVE_KEY },
      create: { key: ARISAN_INITIAL_SAVE_KEY, value: String(validation.data) },
      update: { value: String(validation.data) },
    })

    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "UPDATE",
      entity: "appSetting",
      entityId: ARISAN_INITIAL_SAVE_KEY,
      summary: "Mengubah saldo awal dana save",
      after: {
        key: ARISAN_INITIAL_SAVE_KEY,
        value: String(validation.data),
      },
    })

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to set initial save:", error)
    return { error: "Gagal menyimpan saldo awal" }
  }
}
