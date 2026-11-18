import type { ArisanPaymentMatrix } from "./actions/get-arisan-payment-matrix"
import { MONTHS } from "@/lib/months"
import { computeMonthlyDeficits } from "@/lib/payments/arrears"

export function buildArisanArrearsRows(
  matrix: ArisanPaymentMatrix,
  year: number,
  now: Date = new Date()
) {
  const deficits = computeMonthlyDeficits(matrix, year, 0, now)

  return matrix.members.flatMap((member) => {
    const months = deficits.get(member.id)
    if (!months?.size) return []

    return [{
      name: member.name,
      months: [...months.keys()].sort((a, b) => a - b).map((month) => MONTHS[month - 1]).join(", "),
      amount: [...months.values()].reduce((total, amount) => total + amount, 0),
    }]
  })
}
