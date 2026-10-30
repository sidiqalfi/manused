"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DownloadIcon, FileJsonIcon, FileSpreadsheetIcon } from "lucide-react"
import { useIsGuest } from "@/features/auth/components/guest-context"
import {
  download,
  formatDate,
  pickColumns,
  slugify,
  toCsv,
  todayStamp,
} from "@/lib/export-utils"

export interface ExportSosialIncome {
  memberName: string
  amount: number
  paidAt: Date | string
  note?: string | null
}

export interface ExportSosialExpense {
  description: string
  amount: number
  spentAt: Date | string
}

interface ExportSosialButtonProps {
  periodLabel: string
  incomes: ExportSosialIncome[]
  expenses: ExportSosialExpense[]
}

type ColumnKey =
  | "Jenis"
  | "Keterangan"
  | "Nama"
  | "Nominal"
  | "Tanggal"
  | "Catatan"

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "Jenis", label: "Jenis (Iuran/Pengeluaran)" },
  { key: "Keterangan", label: "Keterangan" },
  { key: "Nama", label: "Nama/penerima" },
  { key: "Nominal", label: "Nominal" },
  { key: "Tanggal", label: "Tanggal" },
  { key: "Catatan", label: "Catatan" },
]

function toRows(
  incomes: ExportSosialIncome[],
  expenses: ExportSosialExpense[]
): Record<string, string | number>[] {
  const incomeRows = incomes.map((i) => ({
    Jenis: "Iuran",
    Keterangan: "Iuran sosial",
    Nama: i.memberName,
    Nominal: i.amount,
    Tanggal: formatDate(i.paidAt),
    Catatan: i.note ?? "",
  }))
  const expenseRows = expenses.map((e) => ({
    Jenis: "Pengeluaran",
    Keterangan: e.description,
    Nama: "—",
    Nominal: e.amount,
    Tanggal: formatDate(e.spentAt),
    Catatan: "",
  }))
  return [...incomeRows, ...expenseRows]
}

export function ExportSosialButton({
  periodLabel,
  incomes,
  expenses,
}: ExportSosialButtonProps) {
  const isGuest = useIsGuest()
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  // Kolom terpilih dibawa antar pembukaan dialog — default semua.
  const [selected, setSelected] = useState<Set<ColumnKey>>(
    () => new Set(ALL_COLUMNS.map((c) => c.key))
  )
  const rows = toRows(incomes, expenses)
  const base = `sosial-${slugify(periodLabel) || "periode"}-${todayStamp()}`

  // Tamu tidak boleh mengexport data apa pun.
  if (isGuest) return null

  function toggle(key: ColumnKey) {
    setSelected((prev) => {
      // Minimal satu kolom harus tetap terpilih.
      if (prev.has(key) && prev.size === 1) return prev
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(ALL_COLUMNS.map((c) => c.key)))
  }

  function handleExportCsv() {
    download(toCsv(pickColumns(rows, [...selected])), `${base}.csv`, "text/csv;charset=utf-8")
    setColumnDialogOpen(false)
  }

  function handleExportJson() {
    download(
      JSON.stringify(pickColumns(rows, [...selected]), null, 2),
      `${base}.json`,
      "application/json;charset=utf-8"
    )
    setColumnDialogOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" disabled={rows.length === 0}>
              <DownloadIcon />
              Export
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setColumnDialogOpen(true)}>
            <DownloadIcon className="text-muted-foreground" />
            <span>Pilih Kolom…</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportCsv}>
            <FileSpreadsheetIcon className="text-muted-foreground" />
            <span>Export CSV (semua)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportJson}>
            <FileJsonIcon className="text-muted-foreground" />
            <span>Export JSON (semua)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Kolom Export</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selected.size} dari {ALL_COLUMNS.length} kolom dipilih
              </p>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Pilih Semua
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(col.key)}
                    onChange={() => toggle(col.key)}
                    className="h-4 w-4"
                  />
                  {col.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setColumnDialogOpen(false)}
              >
                Batal
              </Button>
              <Button variant="outline" onClick={handleExportJson}>
                <FileJsonIcon className="text-muted-foreground" />
                JSON
              </Button>
              <Button onClick={handleExportCsv}>
                <FileSpreadsheetIcon />
                CSV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
