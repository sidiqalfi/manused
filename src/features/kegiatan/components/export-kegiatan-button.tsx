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

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Tidak Aktif",
}

type ExportParticipant = {
  name: string
  fullName: string
  status: string
  attending: boolean
  joinedAt: Date | string
  totalPaid: number
  expected: number
  remaining: number
  history: { amount: number; paidAt: Date | string; note?: string | null }[]
}

interface ExportKegiatanButtonProps {
  kegiatanName: string
  data: ExportParticipant[]
  disabled?: boolean
}

type ColumnKey =
  | "Nama"
  | "Nama Lengkap"
  | "Status"
  | "Kehadiran"
  | "Tanggal Ikut"
  | "Wajib"
  | "Total Dibayar"
  | "Sisa"
  | "Status Bayar"
  | "Riwayat"

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "Nama", label: "Nama panggilan" },
  { key: "Nama Lengkap", label: "Nama lengkap" },
  { key: "Status", label: "Status keanggotaan" },
  { key: "Kehadiran", label: "Kehadiran (Hadir/Patungan)" },
  { key: "Tanggal Ikut", label: "Tanggal ikut" },
  { key: "Wajib", label: "Iuran wajib" },
  { key: "Total Dibayar", label: "Total dibayar" },
  { key: "Sisa", label: "Sisa belum bayar" },
  { key: "Status Bayar", label: "Status bayar (Lunas/Kurang)" },
  { key: "Riwayat", label: "Riwayat pembayaran" },
]

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ""
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function toRows(data: ExportParticipant[]): Record<string, string | number>[] {
  return data.map((p) => ({
    Nama: p.name,
    "Nama Lengkap": p.fullName,
    Status: STATUS_LABEL[p.status] ?? p.status,
    Kehadiran: p.attending ? "Hadir" : "Patungan",
    "Tanggal Ikut": formatDate(p.joinedAt),
    Wajib: p.expected,
    "Total Dibayar": p.totalPaid,
    Sisa: p.remaining,
    "Status Bayar": p.remaining <= 0 ? "Lunas" : "Kurang",
    Riwayat: p.history
      .map((h) => `${formatDate(h.paidAt)}: ${h.amount}${h.note ? ` (${h.note})` : ""}`)
      .join("; "),
  }))
}

function pickColumns(
  rows: Record<string, string | number>[],
  columns: ColumnKey[]
): Record<string, string | number>[] {
  return rows.map((row) => {
    const picked: Record<string, string | number> = {}
    for (const col of columns) {
      picked[col] = row[col]
    }
    return picked
  })
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? "")
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ""

  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
  ]

  // BOM supaya Excel membaca UTF-8 dengan benar
  return "﻿" + lines.join("\r\n")
}

function todayStamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

function download(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function ExportKegiatanButton({
  kegiatanName,
  data,
  disabled,
}: ExportKegiatanButtonProps) {
  const isGuest = useIsGuest()
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  // Kolom terpilih dibawa antar pembukaan dialog — default semua.
  const [selected, setSelected] = useState<Set<ColumnKey>>(
    () => new Set(ALL_COLUMNS.map((c) => c.key))
  )
  const base = `kegiatan-${slugify(kegiatanName) || "peserta"}-${todayStamp()}`

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
    const rows = pickColumns(toRows(data), [...selected])
    download(toCsv(rows), `${base}.csv`, "text/csv;charset=utf-8")
    setColumnDialogOpen(false)
  }

  function handleExportJson() {
    const rows = pickColumns(toRows(data), [...selected])
    download(
      JSON.stringify(rows, null, 2),
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
            <Button variant="outline" disabled={disabled || data.length === 0}>
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
