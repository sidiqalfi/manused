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
import {
  computeEventArrears,
  computeEventDeficits,
} from "@/lib/payments/kegiatan-arrears"
import type { KegiatanPaymentMatrix } from "@/features/kegiatan/actions/get-kegiatan-payment-matrix"

type Props = {
  matrix: KegiatanPaymentMatrix | null
  loading: boolean
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

function shortDate(d: Date): string {
  const date = new Date(d)
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`
}

export function KegiatanPaymentMatrixTable({ matrix, loading }: Props) {
  if (loading) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Memuat matriks kegiatan...
      </p>
    )
  }

  if (!matrix || matrix.events.length === 0) {
    return null
  }

  const { members, events } = matrix

  const arrearsMap = computeEventArrears(matrix)
  const deficitsMap = computeEventDeficits(matrix)
  const nowTs = Date.now()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Rekap Iuran Kegiatan</h3>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 z-10 min-w-[10rem] bg-background">
                Anggota
              </TableHead>
              {events.map((event) => (
                <TableHead
                  key={event.id}
                  className="min-w-[8rem] max-w-[12rem] p-2 align-top text-center"
                  title={`${event.name} — ${shortDate(event.date)}`}
                >
                  <span className="block whitespace-normal break-words text-xs font-medium leading-snug">
                    {event.name}
                  </span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {shortDate(event.date)}
                  </span>
                </TableHead>
              ))}
              <TableHead className="text-center">Tunggakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const arrears = arrearsMap.get(member.id)
              const memberDeficits = deficitsMap.get(member.id)
              return (
                <TableRow
                  key={member.id}
                  className={arrears ? "bg-destructive/5" : undefined}
                >
                  <TableCell className="sticky left-0 z-10 min-w-[10rem] bg-background font-medium">
                    {member.name}
                  </TableCell>
                  {events.map((event) => {
                    const isParticipant = event.participantIds.includes(member.id)
                    const amount = event.paidBy[member.id]
                    const remainingDeficit = memberDeficits?.get(event.id)
                    const isPast = new Date(event.date).getTime() < nowTs
                    const unpaidUpcoming =
                      isParticipant && !isPast &&
                      (amount ?? 0) < event.expected
                    return (
                      <TableCell
                        key={event.id}
                        className="text-center tabular-nums"
                      >
                        {!isParticipant ? (
                          <span className="text-muted-foreground/30">·</span>
                        ) : amount !== undefined ? (
                          <span>{shortFormat(amount)}</span>
                        ) : remainingDeficit !== undefined ? (
                          <span
                            className="font-semibold text-destructive"
                            title={`Belum bayar (wajib ${shortFormat(event.expected)})`}
                          >
                            ✕
                          </span>
                        ) : unpaidUpcoming ? (
                          <span
                            className="font-medium text-orange-500"
                            title={`Belum setor (wajib ${shortFormat(event.expected)}) — event belum lewat`}
                          >
                            ○
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">–</span>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center tabular-nums">
                    {arrears ? (
                      <span className="font-semibold text-destructive">
                        {shortFormat(arrears.amount)}
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
                  colSpan={events.length + 2}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Belum ada peserta kegiatan tahun ini
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
