"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import { auth } from "@features/auth/lib/auth"

export interface KegiatanPaymentMatrixEvent {
  id: string
  name: string
  date: Date
  /** feePerPerson event ini (default bila peserta tanpa override) */
  expected: number
  /** memberId -> iuran yang disepakati (override expectedAmount; patungan) */
  expectedByMember: Record<string, number>
  /** memberId yang terdaftar sebagai peserta event ini */
  participantIds: string[]
  /** memberId -> total dibayar di event ini */
  paidBy: Record<string, number>
}

export interface KegiatanPaymentMatrixMember {
  id: string
  name: string
  fullName: string
}

export interface KegiatanPaymentMatrix {
  members: KegiatanPaymentMatrixMember[]
  events: KegiatanPaymentMatrixEvent[]
}

export interface GetKegiatanPaymentMatrixResult {
  success: boolean
  data?: KegiatanPaymentMatrix
  error?: string
}

const yearSchema = z.number().int().min(2020).max(2100)

export async function getKegiatanPaymentMatrix(
  year: number
): Promise<GetKegiatanPaymentMatrixResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const validation = yearSchema.safeParse(year)
  if (!validation.success) {
    return { success: false, error: "Tahun tidak valid" }
  }

  try {
    const start = new Date(`${year}-01-01T00:00:00.000Z`)
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`)

    const kegiatanList = await prisma.kegiatan.findMany({
      where: { eventDate: { gte: start, lt: end } },
      select: {
        id: true,
        name: true,
        eventDate: true,
        feePerPerson: true,
        participants: {
          select: { memberId: true, attending: true, expectedAmount: true },
        },
        payments: { select: { memberId: true, amount: true } },
      },
      orderBy: { eventDate: "asc" },
    })

    const events: KegiatanPaymentMatrixEvent[] = kegiatanList.map((k) => {
      const paidBy: Record<string, number> = {}
      for (const p of k.payments) {
        paidBy[p.memberId] = (paidBy[p.memberId] ?? 0) + p.amount
      }
      const expectedByMember: Record<string, number> = {}
      for (const p of k.participants) {
        if (p.expectedAmount !== null) {
          expectedByMember[p.memberId] = p.expectedAmount
        }
      }
      return {
        id: k.id,
        name: k.name,
        date: k.eventDate,
        expected: k.feePerPerson,
        expectedByMember,
        participantIds: k.participants.map((p) => p.memberId),
        paidBy,
      }
    })

    // Member unik = yang pernah jadi peserta event mana pun di tahun itu.
    const memberIds = Array.from(
      new Set(events.flatMap((e) => e.participantIds))
    )

    const members =
      memberIds.length > 0
        ? await prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: { id: true, name: true, fullName: true },
            orderBy: { name: "asc" },
          })
        : []

    return { success: true, data: { members, events } }
  }
  catch (error) {
    console.error("Failed to fetch kegiatan payment matrix:", error)
    return { success: false, error: "Gagal memuat matriks kegiatan" }
  }
}
