"use client"

import { Badge } from "@/components/ui/badge"
import { MONTHS } from "@/lib/months"
import { formatCurrency, formatDate } from "@/lib/format"
import type { ArisanYearDrawItem } from "../actions/get-arisan-year-draws"

type Props = {
  draws: ArisanYearDrawItem[] | null
  loading: boolean
  year: number
}

export function ArisanYearDrawHistory({ draws, loading, year }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Riwayat Kocokan</h3>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Pemenang</th>
              <th className="p-3 text-left text-sm font-medium">Siklus</th>
              <th className="p-3 text-left text-sm font-medium">Periode</th>
              <th className="p-3 text-left text-sm font-medium">Terkumpul</th>
              <th className="p-3 text-left text-sm font-medium">Dibayarkan</th>
              <th className="p-3 text-left text-sm font-medium">Save</th>
              <th className="p-3 text-left text-sm font-medium">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="p-4 text-center text-sm text-muted-foreground"
                >
                  Memuat riwayat...
                </td>
              </tr>
            )}
            {!loading && (!draws || draws.length === 0) && (
              <tr>
                <td
                  colSpan={7}
                  className="p-4 text-center text-sm text-muted-foreground"
                >
                  Belum ada kocokan tercatat di tahun {year}
                </td>
              </tr>
            )}
            {(draws ?? []).map((draw) => (
              <tr key={draw.id} className="border-b">
                <td className="p-3 text-sm font-medium">
                  <span>{draw.winnerName}</span>
                  {draw.voided && (
                    <Badge variant="outline" className="ml-2">
                      Dibatalkan
                    </Badge>
                  )}
                </td>
                <td className="p-3 text-sm">{draw.cycleNumber}</td>
                <td className="p-3 text-sm">
                  {MONTHS[draw.period.month - 1]} {draw.period.year}
                </td>
                <td className="p-3 text-sm">
                  {formatCurrency(draw.collectedAmount)}
                </td>
                <td className="p-3 text-sm">
                  {formatCurrency(draw.payoutAmount)}
                </td>
                <td className="p-3 text-sm tabular-nums">
                  {formatCurrency(draw.collectedAmount - draw.payoutAmount)}
                </td>
                <td className="p-3 text-sm">{formatDate(draw.drawnAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
