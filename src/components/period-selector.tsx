"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MONTHS } from "@/lib/months"

export type PeriodOption = {
  id: string
  month: number
  year: number
}

/** Sentinel URL untuk mode tanpa periode (summary gabungan semua bulan). */
const ALL = "all"

type Props = {
  periods: PeriodOption[]
  onPeriodChange: (periodId: string) => void
  createPeriodTrigger?: React.ReactNode
}

/**
 * Pemilih periode dengan tiga perilaku:
 * 1. Auto-select periode terbaru (periods[0]) saat daftar termuat dan URL
 *    belum membawa pilihan — pengguna tidak menemui dead-end kosong.
 * 2. Pilihan tersimpan di query param `?period=` sehingga refresh dan
 *    share-link mempertahankan konteks halaman.
 * 3. Opsi "Semua Periode" mengosongkan pilihan (onPeriodChange("")) —
 *    halaman menampilkan summary gabungan lintas bulan.
 */
export function PeriodSelector({
  periods,
  onPeriodChange,
  createPeriodTrigger,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlPeriod = searchParams.get("period")

  // Guard agar onPeriodChange tidak dipanggil berulang dengan nilai sama.
  const lastNotified = useRef<string | null>(null)

  const effectiveId = (() => {
    if (urlPeriod === ALL) return ALL
    if (urlPeriod && periods.some((p) => p.id === urlPeriod)) return urlPeriod
    return periods[0]?.id ?? ""
  })()

  useEffect(() => {
    if (periods.length === 0) return
    if (effectiveId === lastNotified.current) return

    lastNotified.current = effectiveId
    onPeriodChange(effectiveId === ALL ? "" : effectiveId)

    // Sinkronkan URL saat fallback ke periods[0] (URL kosong/tidak valid).
    if (effectiveId !== urlPeriod) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("period", effectiveId)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId, periods.length, urlPeriod, pathname])

  function writeUrl(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (!id) return
    writeUrl(id)
    onPeriodChange(id === ALL ? "" : id)
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={effectiveId}
        onChange={handleChange}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        aria-label="Pilih periode"
      >
        {periods.length > 0 && <option value={ALL}>Semua Periode</option>}
        {periods.length === 0 && <option value="">Pilih Periode</option>}
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
