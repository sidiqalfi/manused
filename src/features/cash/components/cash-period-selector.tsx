"use client"

import { useState, useEffect } from "react"
import { getCashPeriods } from "../actions/get-cash-periods"
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
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedId, setSelectedId] = useState<string>("")

  const loadPeriods = () => {
    getCashPeriods().then((result) => {
      setPeriods(result.success ? result.data ?? [] : [])
    })
  }

  useEffect(() => {
    loadPeriods()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedId(id)
    onPeriodChange(id)
  }

  const refreshPeriods = () => {
    loadPeriods()
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
      <CreatePeriodDialog onCreated={refreshPeriods} />
    </div>
  )
}
