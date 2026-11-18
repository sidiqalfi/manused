import type { ArisanPaymentMatrix } from "@/features/arisan/actions/get-arisan-payment-matrix"

export type MemberArrears = {
  /** jumlah bulan jatuh tempo yang masih belum tertutup pembayaran */
  count: number
  /** total nominal wajib yang belum tertutup pembayaran */
  amount: number
}

/**
 * Tunggakan per anggota dari matriks pembayaran, dengan settlement FIFO:
 * pembayaran berlebih di bulan mana pun otomatis menutup kekurangan bulan
 * sebelumnya (tertua dulu). Contoh: tidak bayar Sep (wajib 5rb) lalu bayar
 * 10rb di Okt (wajib 5rb) => kelebihan 5rb menutup Sep => tidak nunggak.
 *
 * Defisit dihitung untuk bulan yang sudah lewat, atau bulan berjalan yang
 * sudah memiliki kocokan aktif, dan sebelum `beforeMonth` bila diberikan.
 * Kredit (settlement) diambil
 * dari SEMUA pembayaran tercatat — kelebihan bayar di bulan apa pun, termasuk
 * bulan berjalan atau prabayar, tetap bisa menutup nunggakan lama. Bulan
 * depan tidak pernah dianggap nunggak.
 */
export function computeArrears(
  matrix: ArisanPaymentMatrix,
  year: number,
  beforeMonth: number,
  /** Injeksi waktu untuk test — default waktu sekarang. */
  now: Date = new Date()
): Map<string, MemberArrears> {
  const result = new Map<string, MemberArrears>()
  for (const [memberId, deficits] of computeMonthlyDeficits(matrix, year, beforeMonth, now)) {
    result.set(memberId, {
      count: deficits.size,
      amount: [...deficits.values()].reduce((sum, amount) => sum + amount, 0),
    })
  }

  return result
}

/**
 * Sisa defisit per bulan per anggota SETELAH settlement FIFO — dipakai UI
 * untuk menentukan sel bulan mana yang masih ✕ nunggak (defisit bulan yang
 * sudah tertutup kelebihan bayar tidak lagi ditandai).
 * Key map luar = memberId; key map dalam = bulan (1-12) -> sisa defisit.
 */
export function computeMonthlyDeficits(
  matrix: ArisanPaymentMatrix,
  year: number,
  beforeMonth: number,
  now: Date = new Date()
): Map<string, Map<number, number>> {
  const nowKey = now.getFullYear() * 12 + now.getMonth()
  const limitKey = year * 12 + (beforeMonth - 1)

  const result = new Map<string, Map<number, number>>()
  const sortedMonths = [...matrix.months].sort((a, b) => a.month - b.month)

  for (const member of matrix.members) {
    const deficits = new Map<number, number>()

    for (const month of sortedMonths) {
      const key = year * 12 + (month.month - 1)
      const isDue = key < nowKey || (key === nowKey && month.hasActiveDraw === true)
      const isDeficitSource =
        isDue && (beforeMonth === 0 || key < limitKey)

      const credit = (month.paidBy[member.id] ?? 0) - month.expected

      if (credit >= 0) {
        // kelebihan menutup defisit bulan tertua dulu
        let surplus = credit
        const oldestFirst = [...deficits.keys()].sort((a, b) => a - b)
        for (const m of oldestFirst) {
          if (surplus <= 0) break
          const owed = deficits.get(m)!
          const applied = Math.min(owed, surplus)
          deficits.set(m, owed - applied)
          surplus -= applied
          if (deficits.get(m) === 0) deficits.delete(m)
        }
      } else if (isDeficitSource) {
        deficits.set(month.month, -credit)
      }
    }

    if (deficits.size > 0) {
      result.set(member.id, deficits)
    }
  }

  return result
}
