import { Prisma } from "@/generated/prisma/client"

export const ACTIVITY_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGIN_FAILED",
  "LOGOUT",
] as const

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number]

export interface ActivityLogActor {
  id: string | null
  name: string | null
  email: string | null
}

export interface ActivityLogInput {
  actor: ActivityLogActor
  action: ActivityAction
  entity: string
  entityId?: string | null
  summary: string
  before?: unknown
  after?: unknown
}

export interface ActivityLogWriter {
  activityLog: {
    create: (args: {
      data: Prisma.ActivityLogUncheckedCreateInput
    }) => Promise<unknown>
  }
}

/**
 * Bangun payload `activityLog.create` dari input. Dipakai dua cara:
 * 1. oleh `logActivity` untuk aksi tanpa transaksi,
 * 2. langsung oleh aksi bertransaksi array-form supaya log ikut atomik.
 */
export function activityLogData(
  input: ActivityLogInput
): Prisma.ActivityLogUncheckedCreateInput {
  const data: Prisma.ActivityLogUncheckedCreateInput = {
    actorId: input.actor.id,
    actorName: input.actor.name,
    actorEmail: input.actor.email,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    summary: input.summary,
  }

  if (input.before !== undefined) {
    data.before = input.before as Prisma.InputJsonValue
  }
  if (input.after !== undefined) {
    data.after = input.after as Prisma.InputJsonValue
  }

  return data
}

/**
 * Tulis satu baris log aktivitas. Best-effort: kegagalan menulis log tidak
 * menggagalkan aksi utama (kecuali transaksi induknya sendiri yang gagal).
 */
export async function logActivity(
  tx: ActivityLogWriter,
  input: ActivityLogInput
): Promise<void> {
  try {
    await tx.activityLog.create({ data: activityLogData(input) })
  } catch (error) {
    console.error("Failed to write activity log:", error)
  }
}
