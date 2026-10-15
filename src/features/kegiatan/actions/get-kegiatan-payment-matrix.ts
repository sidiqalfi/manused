"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

export interface KegiatanPaymentMatrixEvent {
  id: string
  name: string
  date: Date
  /** feePerPerson event ini */
  expected: number
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
        participants: { select: { memberId: true } },
        payments: { select: { memberId: true, amount: true } },
      },
      orderBy: { eventDate: "asc" },
    })

    const events: KegiatanPaymentMatrixEvent[] = kegiatanList.map((k) => {
      const paidBy: Record<string, number> = {}
      for (const p of k.payments) {
        paidBy[p.memberId] = (paidBy[p.memberId] ?? 0) + p.amount
      }
      return {
        id: k.id,
        name: k.name,
        date: k.eventDate,
        expected: k.feePerPerson,
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
