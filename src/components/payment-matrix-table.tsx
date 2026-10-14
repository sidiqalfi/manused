"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MONTHS } from "@/lib/months"
import type { ArisanPaymentMatrix } from "@/features/arisan/actions/get-arisan-payment-matrix"

type Props = {
  title?: string
  matrix: ArisanPaymentMatrix | null
  loading: boolean
  year: number
}

function shortFormat(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    const value = Number.isInteger(millions) ? millions : millions.toFixed(1)
    return `${value}jt`
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000
    const value = Number.isInteger(thousands) ? thousands : thousands.toFixed(1)
    return `${value}rb`
  }
  return String(amount)
}

/** true kalau bulan (1-12, tahun matrix) sudah lewat dari hari ini */
function isPastMonth(month: number, year: number): boolean {
  const now = new Date()
  const current = now.getFullYear() * 12 + now.getMonth()
  const target = year * 12 + (month - 1)
  return target < current
}

export function PaymentMatrixTable({ title, matrix, loading, year }: Props) {
  if (loading) {
    return (
      <p className="text-center py-6 text-sm text-muted-foreground">
        Memuat matriks pembayaran...
      </p>
    )
  }

  if (!matrix || matrix.months.length === 0) {
    return null
  }

  const { members, months } = matrix

  // Tunggakan per anggota: bulan lewat tanpa bayar x nominal wajib bulan itu
  const arrearsByMember = new Map<string, number>()
  for (const member of members) {
    let total = 0
    for (const month of months) {
      if (!isPastMonth(month.month, year)) continue
      if (month.paidBy[member.id] === undefined) {
        total += month.expected
      }
    }
    if (total > 0) arrearsByMember.set(member.id, total)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title ?? `Iuran ${year}`}</h3>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 z-10 bg-background min-w-[10rem]">
                Anggota
              </TableHead>
              {months.map((month) => (
                <TableHead key={month.month} className="text-center">
                  {MONTHS[month.month - 1]?.slice(0, 3)}
                </TableHead>
              ))}
              <TableHead className="text-center">Tunggakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const arrears = arrearsByMember.get(member.id) ?? 0
              return (
                <TableRow
                  key={member.id}
                  className={arrears > 0 ? "bg-destructive/5" : undefined}
                >
                  <TableCell className="sticky left-0 z-10 bg-background font-medium min-w-[10rem]">
                    {member.name}
                    <span className="block text-xs text-muted-foreground">
                      {member.fullName}
                    </span>
                  </TableCell>
                  {months.map((month) => {
                    const amount = month.paidBy[member.id]
                    const overdue =
                      isPastMonth(month.month, year) && amount === undefined
                    return (
                      <TableCell
                        key={month.month}
                        className="text-center tabular-nums"
                      >
                        {amount !== undefined ? (
                          <span>{shortFormat(amount)}</span>
                        ) : overdue ? (
                          <span
                            className="text-destructive font-semibold"
                            title={`Belum bayar (wajib ${shortFormat(month.expected)})`}
                          >
                            ✕
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">–</span>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center tabular-nums">
                    {arrears > 0 ? (
                      <span className="text-destructive font-semibold">
                        {shortFormat(arrears)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">–</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {members.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={months.length + 2}
                  className="text-center py-8 text-sm text-muted-foreground"
                >
                  Belum ada anggota aktif
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
