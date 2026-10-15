"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"
import { kegiatanListQuery } from "@/features/kegiatan/queries"
import { KEGIATAN_STATUS_LABEL } from "@/features/kegiatan/kegiatan-schemas"
import { formatDate } from "@/lib/format"

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PLANNED: "secondary",
  COMPLETED: "default",
  CANCELLED: "outline",
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function KegiatanCalendar() {
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date>(new Date())
  const listResult = useQuery(kegiatanListQuery)
  const kegiatanList = listResult.data?.success
    ? listResult.data.data ?? []
    : []

  const events = useMemo(
    () =>
      kegiatanList.map((k) => ({
        ...k,
        eventDate: new Date(k.eventDate),
      })),
    [kegiatanList],
  )

  // Tanggal yang punya event (untuk modifier highlight dot).
  const eventDays = useMemo(() => events.map((e) => e.eventDate), [events])

  // Event di tanggal terpilih; kalau tidak ada, tampilkan event seluruh bulan.
  const dayEvents = selected
    ? events.filter((e) => sameDay(e.eventDate, selected))
    : []
  const monthEvents = events
    .filter((e) => sameMonth(e.eventDate, month))
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())

  const listTitle =
    dayEvents.length > 0
      ? `Kegiatan ${selected ? formatDate(selected) : ""}`
      : `Semua kegiatan bulan ini (${monthEvents.length})`
  const listItems = dayEvents.length > 0 ? dayEvents : monthEvents

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kalender Kegiatan</h2>
        <Link
          href="/dashboard/kegiatan"
          className="text-sm text-muted-foreground hover:underline"
        >
          Lihat semua →
        </Link>
      </div>

      <div className="rounded-md border p-2">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          month={month}
          onMonthChange={setMonth}
          modifiers={{ event: eventDays }}
          modifiersClassNames={{
            event:
              "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
          }}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {listTitle}
        </p>
        {listItems.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Tidak ada kegiatan di bulan ini.
          </div>
        ) : (
          <ul className="space-y-2">
            {listItems.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/dashboard/kegiatan/${e.id}`}
                  className="flex items-start justify-between gap-3 rounded-md border p-3 transition hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.eventDate)}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={STATUS_VARIANT[e.status] ?? "outline"}
                    className="shrink-0"
                  >
                    {KEGIATAN_STATUS_LABEL[e.status] ?? e.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
