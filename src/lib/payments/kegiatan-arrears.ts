import type {
  KegiatanPaymentMatrix,
  KegiatanPaymentMatrixEvent,
} from "@/features/kegiatan/actions/get-kegiatan-payment-matrix"

export type EventArrears = { count: number; amount: number }

function dateKey(d: Date): number {
  return new Date(d).getTime()
}

/**
 * Iuran yang diharapkan dari member ini di event ini — override patungan
 * (expectedByMember) bila ada, selain itu feePerPerson event.
 */
function expectedFor(event: KegiatanPaymentMatrixEvent, memberId: string): number {
  return event.expectedByMember[memberId] ?? event.expected
}

/**
 * Tunggakan per member dari matriks pembayaran kegiatan — TANPA FIFO antar
 * event. Tiap event mandiri: kurang bayar di event A tidak bisa ditutup
 * kelebihan bayar di event B. Hanya event yang sudah lewat (eventDate <
 * hari ini) yang dihitung, dan hanya untuk member yang terdaftar sebagai
 * peserta event itu.
 */
export function computeEventArrears(
  matrix: KegiatanPaymentMatrix,
  now: Date = new Date()
): Map<string, EventArrears> {
  const nowTs = now.getTime()
  const result = new Map<string, EventArrears>()

  for (const member of matrix.members) {
    let count = 0
    let amount = 0

    for (const event of matrix.events) {
      // Bukan peserta event ini → bukan tanggung jawabnya.
      if (!event.participantIds.includes(member.id)) continue
      // Event belum lewat → belum nunggak.
      if (dateKey(event.date) >= nowTs) continue

      const paid = event.paidBy[member.id] ?? 0
      const deficit = expectedFor(event, member.id) - paid
      if (deficit > 0) {
        count += 1
        amount += deficit
      }
    }

    if (count > 0) {
      result.set(member.id, { count, amount })
    }
  }

  return result
}

/**
 * Sisa defisit per event per member — dipakai UI untuk menandai sel ✕.
 * Key map luar = memberId; key map dalam = eventId -> sisa defisit.
 */
export function computeEventDeficits(
  matrix: KegiatanPaymentMatrix,
  now: Date = new Date()
): Map<string, Map<string, number>> {
  const nowTs = now.getTime()
  const result = new Map<string, Map<string, number>>()

  for (const member of matrix.members) {
    const deficits = new Map<string, number>()

    for (const event of matrix.events) {
      if (!event.participantIds.includes(member.id)) continue
      if (dateKey(event.date) >= nowTs) continue

      const paid = event.paidBy[member.id] ?? 0
      const deficit = expectedFor(event, member.id) - paid
      if (deficit > 0) {
        deficits.set(event.id, deficit)
      }
    }

    if (deficits.size > 0) {
      result.set(member.id, deficits)
    }
  }

  return result
}
