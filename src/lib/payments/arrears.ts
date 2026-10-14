import type { ArisanPaymentMatrix } from "@/features/arisan/actions/get-arisan-payment-matrix"

export type MemberArrears = {
  /** jumlah bulan lewat tanpa bayar */
  count: number
  /** total nominal wajib yang belum dibayar */
  amount: number
}

/**
 * Tunggakan per anggota dari matriks pembayaran: bulan-bulan yang SUDAH LEWAT
 * dan sebelum `beforeMonth` (periode yang sedang dibuka) tanpa record iuran.
 * beforeMonth = 0 berarti semua bulan lewat tahun ini dihitung.
 */
export function computeArrears(
  matrix: ArisanPaymentMatrix,
  year: number,
  beforeMonth: number
): Map<string, MemberArrears> {
  const now = new Date()
  const nowKey = now.getFullYear() * 12 + now.getMonth() // bulan berjalan (0-based)
  const limitKey = year * 12 + (beforeMonth - 1) // bulan periode aktif (0-based)

  const result = new Map<string, MemberArrears>()
  for (const member of matrix.members) {
    let count = 0
    let amount = 0
    for (const month of matrix.months) {
      const monthKey = year * 12 + (month.month - 1)
      // lewat dari hari ini DAN sebelum bulan periode yang sedang dibuka
      if (monthKey >= nowKey || monthKey >= limitKey) continue
      if (month.paidBy[member.id] === undefined) {
        count += 1
        amount += month.expected
      }
    }
    if (count > 0) {
      result.set(member.id, { count, amount })
    }
  }
  return result
}
