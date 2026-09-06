"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import {
  createArisanIncomesBatchSchema,
  getArisanIncomeBatchFormValues,
} from "../arisan-schemas"
import { activityLogData } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

export async function createArisanIncomesBatch(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id
  const actor = {
    id: userId,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  }

  const validation = createArisanIncomesBatchSchema.safeParse(
    getArisanIncomeBatchFormValues(formData),
  )
  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  const { mode, periodId, memberIds, amount, paidAt, note } = validation.data

  try {
    const period = await prisma.arisanPeriod.findUnique({
      where: { id: periodId },
      include: { draws: { where: { voided: false } } },
    })
    if (!period) {
      return { error: "Periode tidak ditemukan atau sudah dihapus" }
    }

    if (period.draws.length > 0) {
      return { error: "Periode sudah di-kocok, iuran terkunci" }
    }

    const resolvedMemberIds = await resolveMemberIds(
      mode,
      periodId,
      memberIds,
    )
    if (resolvedMemberIds.length === 0) {
      return { error: "Tidak ada kepala rumah yang belum bayar" }
    }

    const entries = resolvedMemberIds.map((memberId) => ({
      memberId,
      incomeId: crypto.randomUUID(),
    }))

    await prisma.$transaction([
      ...entries.map((entry) =>
        prisma.arisanIncome.create({
          data: {
            id: entry.incomeId,
            periodId,
            memberId: entry.memberId,
            amount,
            paidAt,
            note,
            createdById: userId,
          },
        }),
      ),
      ...entries.map((entry) =>
        prisma.activityLog.create({
          data: activityLogData({
            actor,
            action: "CREATE",
            entity: "arisanIncome",
            entityId: entry.incomeId,
            summary: "Mencatat iuran arisan (batch)",
            after: {
              periodId,
              memberId: entry.memberId,
              amount,
              paidAt: paidAt.toISOString(),
              note: note ?? null,
            },
          }),
        }),
      ),
      prisma.arisanPeriod.update({
        where: { id: periodId },
        data: { updatedAt: new Date() },
      }),
    ])

    revalidatePath("/dashboard/arisan")
    return { success: true, count: entries.length }
  } catch (error) {
    console.error("Failed to create arisan incomes batch:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2002") {
      return { error: "Ada anggota yang sudah tercatat bayar di periode ini" }
    }
    if (prismaError.code === "P2003") {
      return { error: "Data periode atau anggota tidak valid" }
    }
    if (prismaError.code === "P2001" || prismaError.code === "P2025") {
      return { error: "Database tidak dapat diakses, coba lagi nanti" }
    }
    return { error: "Gagal mencatat iuran arisan batch" }
  }
}

async function resolveMemberIds(
  mode: "all" | "selected",
  periodId: string,
  memberIds: string[],
): Promise<string[]> {
  if (mode === "selected") {
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, headOfHouseholdId: true },
    })

    if (
      members.length !== memberIds.length ||
      members.some((m) => m.headOfHouseholdId != null)
    ) {
      return []
    }
    return memberIds
  }

  const [activeHeads, existingIncomes] = await Promise.all([
    prisma.member.findMany({
      where: { status: "ACTIVE", headOfHouseholdId: null },
      select: { id: true },
      orderBy: { name: "asc" },
    }),
    prisma.arisanIncome.findMany({
      where: { periodId },
      select: { memberId: true },
    }),
  ])

  const paid = new Set(existingIncomes.map((i) => i.memberId))
  return activeHeads.map((m) => m.id).filter((id) => !paid.has(id))
}
