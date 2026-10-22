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
import { SortButton, type SortDirection } from "@/components/ui/sort-button"
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
  const [listSortKey, setListSortKey] = useState<
    "name" | "date" | "status" | "participants" | "fee" | "collected" | "spent" | "diff"
  >("date")
  const [listSortDirection, setListSortDirection] = useState<SortDirection>("desc")
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

  type ListSortKey =
    | "name"
    | "date"
    | "status"
    | "participants"
    | "fee"
    | "collected"
    | "spent"
    | "diff"

  function toggleListSort(key: ListSortKey) {
    if (listSortKey === key) {
      setListSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setListSortKey(key)
      // Default: nama naik; lainnya turun (tanggal terbaru, nominal besar dulu).
      setListSortDirection(key === "name" ? "asc" : "desc")
    }
  }

  const sortedList = [...filtered].sort((a, b) => {
    const dir = listSortDirection === "asc" ? 1 : -1
    const tie = a.name.localeCompare(b.name)
    const collected = (k: typeof a) => k.payments.reduce((s, p) => s + p.amount, 0)
    const spent = (k: typeof a) => k.expenses.reduce((s, e) => s + e.amount, 0)
    switch (listSortKey as ListSortKey) {
      case "name":
        return tie * dir
      case "status": {
        const order: Record<string, number> = {
          PLANNED: 0,
          COMPLETED: 1,
          CANCELLED: 2,
        }
        const av = order[a.status] ?? 9
        const bv = order[b.status] ?? 9
        if (av !== bv) return (av - bv) * dir
        return tie
      }
      case "participants":
        if (a._count.participants !== b._count.participants)
          return (a._count.participants - b._count.participants) * dir
        return tie
      case "fee":
        if (a.feePerPerson !== b.feePerPerson)
          return (a.feePerPerson - b.feePerPerson) * dir
        return tie
      case "collected": {
        const av = collected(a)
        const bv = collected(b)
        if (av !== bv) return (av - bv) * dir
        return tie
      }
      case "spent": {
        const av = spent(a)
        const bv = spent(b)
        if (av !== bv) return (av - bv) * dir
        return tie
      }
      case "diff": {
        const av = collected(a) - spent(a)
        const bv = collected(b) - spent(b)
        if (av !== bv) return (av - bv) * dir
        return tie
      }
      case "date":
      default: {
        const at = new Date(a.eventDate).getTime()
        const bt = new Date(b.eventDate).getTime()
        if (at !== bt) return (at - bt) * dir
        return tie
      }
    }
  })

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
                <TableHead>
                  <SortButton
                    active={listSortKey === "name"}
                    direction={listSortDirection}
                    onClick={() => toggleListSort("name")}
                  >
                    Nama
                  </SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton
                    align="center"
                    active={listSortKey === "date"}
                    direction={listSortDirection}
                    onClick={() => toggleListSort("date")}
                  >
                    Tanggal
                  </SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton
                    align="center"
                    active={listSortKey === "status"}
                    direction={listSortDirection}
                    onClick={() => toggleListSort("status")}
                  >
                    Status
                  </SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton
                    align="center"
                    active={listSortKey === "participants"}
                    direction={listSortDirection}
                    onClick={() => toggleListSort("participants")}
                  >
                    Peserta
                  </SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton
                    align="center"
                    active={listSortKey === "fee"}
                    direction={listSortDirection}
                    onClick={() => toggleListSort("fee")}
                  >
                    Iuran/Orang
                  </SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton
                    align="center"
                    active={listSortKey === "collected"}
                    direction={listSortDirection}
                    onClick={() => toggleListSort("collected")}
                  >
                    Terkumpul
                  </SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton
                    align="center"
                    active={listSortKey === "spent"}
                    direction={listSortDirection}
                    onClick={() => toggleListSort("spent")}
                  >
                    Pengeluaran
                  </SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton
                    align="right"
                    active={listSortKey === "diff"}
                    direction={listSortDirection}
                    onClick={() => toggleListSort("diff")}
                  >
                    Selisih
                  </SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedList.map((k) => {
                const collected = k.payments.reduce((s, p) => s + p.amount, 0)
                const spent = k.expenses.reduce((s, e) => s + e.amount, 0)
                const diff = collected - spent
                return (
                  <TableRow key={k.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/kegiatan/${k.slug}`}
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
