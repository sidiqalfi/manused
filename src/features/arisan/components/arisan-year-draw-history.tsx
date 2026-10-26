"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Pemenang</TableHead>
              <TableHead>Siklus</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Terkumpul</TableHead>
              <TableHead>Dibayarkan</TableHead>
              <TableHead>Save</TableHead>
              <TableHead>Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="p-4 text-center text-muted-foreground">
                  Memuat riwayat...
                </TableCell>
              </TableRow>
            )}
            {!loading && (!draws || draws.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="p-4 text-center text-muted-foreground">
                  Belum ada kocokan tercatat di tahun {year}
                </TableCell>
              </TableRow>
            )}
            {(draws ?? []).map((draw) => (
              <TableRow key={draw.id}>
                <TableCell className="text-sm font-medium">
                  <span>{draw.winnerName}</span>
                  {draw.voided && (
                    <Badge variant="outline" className="ml-2">
                      Dibatalkan
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{draw.cycleNumber}</TableCell>
                <TableCell className="text-sm">
                  {MONTHS[draw.period.month - 1]} {draw.period.year}
                </TableCell>
                <TableCell className="text-sm">
                  {formatCurrency(draw.collectedAmount)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatCurrency(draw.payoutAmount)}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {formatCurrency(draw.collectedAmount - draw.payoutAmount)}
                </TableCell>
                <TableCell className="text-sm">{formatDate(draw.drawnAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
