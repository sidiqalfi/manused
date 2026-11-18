"use client"

import { useState } from "react"
import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsGuest } from "@/features/auth/components/guest-context"
import { todayStamp } from "@/lib/export-utils"
import type { ArisanPaymentMatrix } from "../actions/get-arisan-payment-matrix"
import { buildArisanArrearsRows } from "../arrears-export"

export function ExportArisanArrearsButton({ matrix, year }: { matrix: ArisanPaymentMatrix | null; year: number }) {
  const isGuest = useIsGuest()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  if (isGuest || !matrix) return null
  const rows = buildArisanArrearsRows(matrix, year)

  async function handleExport() {
    if (pending || rows.length === 0) return
    setPending(true)
    setError("")
    setMessage("")

    try {
      const { default: writeExcelFile } = await import("write-excel-file/browser")
      await writeExcelFile([
        ["Nama Anggota", "Bulan Kurang Bayar", "Total Kekurangan (Rp)"].map((value) => ({ value, fontWeight: "bold" as const })),
        ...rows.map((row) => [
          { type: String, value: row.name },
          { type: String, value: row.months, wrap: true },
          { type: Number, value: row.amount, format: "#,##0" },
        ]),
      ], {
        sheet: `Tunggakan ${year}`,
        columns: [{ width: 30 }, { width: 65 }, { width: 26 }],
      }).toFile(`tunggakan-arisan-${year}-${todayStamp()}.xlsx`)
      setMessage("Unduhan Excel dimulai.")
    } catch {
      setError("Gagal menyiapkan file Excel. Silakan coba lagi.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2 sm:text-right">
      <Button type="button" variant="outline" disabled={pending || rows.length === 0} onClick={() => void handleExport()}>
        <DownloadIcon aria-hidden="true" />
        {pending ? "Menyiapkan Excel…" : "Export Excel"}
      </Button>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada tunggakan untuk diekspor.</p> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  )
}
