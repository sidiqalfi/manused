/**
 * Helper bersama untuk tombol export (CSV/JSON dengan pemilih kolom).
 * Pola UI-nya tetap lokal per komponen; yang dibagi hanya serialisasi & unduh.
 */

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ""
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function pickColumns<T extends string>(
  rows: Record<string, string | number>[],
  columns: T[]
): Record<string, string | number>[] {
  return rows.map((row) => {
    const picked: Record<string, string | number> = {}
    for (const col of columns) {
      picked[col] = row[col]
    }
    return picked
  })
}

export function escapeCsv(value: unknown): string {
  const text = String(value ?? "")
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ""

  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
  ]

  // BOM supaya Excel membaca UTF-8 dengan benar
  return "﻿" + lines.join("\r\n")
}

export function todayStamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

export function download(
  content: string,
  filename: string,
  mimeType: string
): void {
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
