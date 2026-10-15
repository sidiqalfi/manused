"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DownloadIcon, FileJsonIcon, FileSpreadsheetIcon } from "lucide-react"

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Tidak Aktif",
}

type ExportParticipant = {
  name: string
  fullName: string
  status: string
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

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ""
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function toRows(data: ExportParticipant[]) {
  return data.map((p) => ({
    Nama: p.name,
    "Nama Lengkap": p.fullName,
    Status: STATUS_LABEL[p.status] ?? p.status,
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
  const base = `kegiatan-${slugify(kegiatanName) || "peserta"}-${todayStamp()}`

  const handleExportCsv = () => {
    download(toCsv(toRows(data)), `${base}.csv`, "text/csv;charset=utf-8")
  }

  const handleExportJson = () => {
    download(
      JSON.stringify(toRows(data), null, 2),
      `${base}.json`,
      "application/json;charset=utf-8"
    )
  }

  return (
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
        <DropdownMenuItem onClick={handleExportCsv}>
          <FileSpreadsheetIcon className="text-muted-foreground" />
          <span>Export CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJson}>
          <FileJsonIcon className="text-muted-foreground" />
          <span>Export JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
