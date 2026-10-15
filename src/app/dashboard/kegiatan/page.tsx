"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreateKegiatanDialog } from "@/features/kegiatan/components/create-kegiatan-dialog"
import {
  kegiatanListQuery,
  kegiatanYearSummaryQuery,
  kegiatanYearPaymentMatrixQuery,
} from "@/features/kegiatan/queries"
import { KegiatanPaymentMatrixTable } from "@/features/kegiatan/components/kegiatan-payment-matrix-table"
import { KEGIATAN_STATUS_LABEL } from "@/features/kegiatan/kegiatan-schemas"
import { formatCurrency, formatDate } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, Users, TrendingUp, TrendingDown } from "lucide-react"

type StatusBadgeVariant = "default" | "secondary" | "outline" | "destructive"

const STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  PLANNED: "secondary",
  COMPLETED: "default",
  CANCELLED: "outline",
}

export default function KegiatanPage() {
  const currentYear = new Date().getFullYear()
  // Filter tahun (client-side — list kegiatan kecil)
  const [yearFilter, setYearFilter] = useState<number>(currentYear)
  const listResult = useQuery(kegiatanListQuery)
  const yearSummaryResult = useQuery(kegiatanYearSummaryQuery(currentYear))
  const matrixResult = useQuery(kegiatanYearPaymentMatrixQuery(yearFilter))
  const matrix = matrixResult.data?.success ? matrixResult.data.data ?? null : null

  const kegiatanList = listResult.data?.success ? listResult.data.data ?? [] : []

  const years = useMemo(() => {
    const set = new Set<number>(
      kegiatanList.map((k) => new Date(k.eventDate).getFullYear())
    )
    set.add(currentYear)
    return Array.from(set).sort((a, b) => b - a)
  }, [kegiatanList, currentYear])

  const filtered = kegiatanList.filter(
    (k) => new Date(k.eventDate).getFullYear() === yearFilter
  )

  const summary = yearSummaryResult.data?.success
    ? yearSummaryResult.data.data
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kegiatan</h1>
          <p className="text-sm text-muted-foreground">
            Event pemuda — HUT, outbound, dan kegiatan lainnya
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter tahun"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <CreateKegiatanDialog />
        </div>
      </div>

      {/* Ringkasan tahun berjalan */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Jumlah Kegiatan {currentYear}</p>
              <p className="text-lg font-semibold tabular-nums">
                {summary ? summary.kegiatanCount : "–"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Potensi Iuran</p>
              <p className="text-lg font-semibold tabular-nums">
                {summary ? formatCurrency(summary.totalExpected) : "–"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Iuran Terkumpul</p>
              <p className="text-lg font-semibold tabular-nums">
                {summary ? formatCurrency(summary.totalCollected) : "–"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Pengeluaran</p>
              <p className="text-lg font-semibold tabular-nums">
                {summary ? formatCurrency(summary.totalExpense) : "–"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rekap tahunan */}
      <KegiatanPaymentMatrixTable matrix={matrix} loading={matrixResult.isPending} />

      {/* Daftar kegiatan */}
      {listResult.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada kegiatan di tahun {yearFilter}. Klik &quot;Kegiatan Baru&quot; untuk memulai.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nama</TableHead>
                <TableHead className="text-center">Tanggal</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Peserta</TableHead>
                <TableHead className="text-center">Iuran/Orang</TableHead>
                <TableHead className="text-center">Terkumpul</TableHead>
                <TableHead className="text-center">Pengeluaran</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((k) => {
                const collected = k.payments.reduce((s, p) => s + p.amount, 0)
                const spent = k.expenses.reduce((s, e) => s + e.amount, 0)
                const diff = collected - spent
                return (
                  <TableRow key={k.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/kegiatan/${k.id}`}
                        className="font-medium hover:underline"
                      >
                        {k.name}
                      </Link>
                      {k.location && (
                        <span className="block text-xs text-muted-foreground">
                          📍 {k.location}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatDate(k.eventDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={STATUS_VARIANT[k.status] ?? "outline"}>
                        {KEGIATAN_STATUS_LABEL[k.status] ?? k.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm">
                      {k._count.participants}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm">
                      {formatCurrency(k.feePerPerson)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm">
                      {formatCurrency(collected)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm">
                      {formatCurrency(spent)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      <span className={diff < 0 ? "text-destructive font-medium" : ""}>
                        {formatCurrency(diff)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
