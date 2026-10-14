"use server"

import crypto from "crypto"
import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import {
  ARISAN_INITIAL_SAVE_KEY,
  getPerformArisanDrawFormValues,
  performArisanDrawSchema,
} from "../arisan-schemas"
import {
  currentCycle,
  hasActiveDraw,
  savings,
  winnersInCycle,
} from "../draw-logic"
import { logActivity } from "@/features/log/activity-log"
import { revalidatePath } from "next/cache"

/**
 * Kocok manual: pemenang dipilih langsung dari hasil pertemuan offline,
 * jadi pool-nya semua kepala rumah aktif — termasuk yang belum bayar iuran.
 * (Kocok otomatis di perform-arisan-draw membatasi ke yang sudah bayar.)
 */
export async function performManualArisanDraw(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const data = getPerformArisanDrawFormValues(formData)
  const validation = performArisanDrawSchema.safeParse(data)

  if (!validation.success) {
    return { error: "Data tidak valid", details: validation.error.issues }
  }

  try {
    const period = await prisma.arisanPeriod.findUnique({
      where: { id: validation.data.periodId },
      include: { incomes: true, draws: true },
    })

    if (!period) {
      return { error: "Periode tidak ditemukan" }
    }

    if (hasActiveDraw(period.draws)) {
      return { error: "Periode sudah di-kocok" }
    }

    const history = await prisma.arisanDraw.findMany({
      select: {
        winnerMemberId: true,
        cycleNumber: true,
        collectedAmount: true,
        payoutAmount: true,
        voided: true,
      },
    })

    const activeHeads = await prisma.member.findMany({
      where: { status: "ACTIVE", headOfHouseholdId: null },
      select: { id: true },
    })

    const cycle = currentCycle(history)
    const won = winnersInCycle(history, cycle)
    if (won.has(validation.data.winnerMemberId)) {
      return {
        error: "Anggota ini sudah menang di siklus yang sedang berjalan",
      }
    }

    if (!activeHeads.some((m) => m.id === validation.data.winnerMemberId)) {
      return { error: "Anggota tidak memenuhi syarat untuk di-kocok" }
    }

    const collectedAmount = period.incomes.reduce((sum, i) => sum + i.amount, 0)
    const payoutAmount = period.payoutTarget
    const setting = await prisma.appSetting.findUnique({
      where: { key: ARISAN_INITIAL_SAVE_KEY },
    })
    const initialSave = setting ? Number(setting.value) : 0
    const savingsAfter =
      savings(initialSave, history) + collectedAmount - payoutAmount

    const drawId = crypto.randomUUID()
    await prisma.arisanDraw.create({
      data: {
        id: drawId,
        periodId: validation.data.periodId,
        winnerMemberId: validation.data.winnerMemberId,
        cycleNumber: cycle,
        collectedAmount,
        payoutAmount,
        savingsAfter,
        drawnAt: validation.data.drawnAt,
        createdById: session.user.id,
      },
    })

    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "CREATE",
      entity: "arisanDraw",
      entityId: drawId,
      summary: "Melakukan kocokan arisan manual",
      after: {
        periodId: validation.data.periodId,
        winnerMemberId: validation.data.winnerMemberId,
        cycleNumber: cycle,
        collectedAmount,
        payoutAmount,
        savingsAfter,
        drawnAt: validation.data.drawnAt.toISOString(),
      },
    })

    revalidatePath("/dashboard/arisan")
    return { success: true }
  } catch (error) {
    console.error("Failed to perform manual arisan draw:", error)
    const prismaError = error as { code?: string }

    if (prismaError.code === "P2003") {
      return { error: "Data periode atau anggota tidak valid" }
    }

    return { error: "Gagal menyimpan hasil kocokan" }
  }
}
