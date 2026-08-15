"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cashPeriodsQuery } from "../queries"
import { CreatePeriodDialog } from "./dialogs/create-period-dialog"

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

type Period = {
  id: string
  month: number
  year: number
}

type Props = {
  onPeriodChange: (periodId: string) => void
}

export function CashPeriodSelector({ onPeriodChange }: Props) {
  const [selectedId, setSelectedId] = useState<string>("")

  const { data: result } = useQuery(cashPeriodsQuery)
  const periods: Period[] = result?.success ? result.data ?? [] : []

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedId(id)
    onPeriodChange(id)
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId}
        onChange={handleChange}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Pilih Periode</option>
        {periods.map((p) => (
          <option key={p.id} value={p.id}>
            {MONTHS[p.month - 1]} {p.year}
          </option>
        ))}
      </select>
      <CreatePeriodDialog />
    </div>
  )
}
