"use client"

import { useState } from "react"
import { MONTHS } from "@/lib/months"

export type PeriodOption = {
  id: string
  month: number
  year: number
}

type Props = {
  periods: PeriodOption[]
  onPeriodChange: (periodId: string) => void
  createPeriodTrigger?: React.ReactNode
}

export function PeriodSelector({
  periods,
  onPeriodChange,
  createPeriodTrigger,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>("")

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
      {createPeriodTrigger}
    </div>
  )
}
