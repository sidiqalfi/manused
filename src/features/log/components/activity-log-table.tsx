"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ACTIVITY_ACTIONS, type ActivityAction } from "../activity-log"
import { activityLogsQuery, activityLogActorsQuery } from "../queries"
import { logsToCsv, logsToJson, CSV_COLUMNS, type LogColumn } from "../log-export"
import type { ActivityLogItem } from "../actions/get-activity-logs"

const PAGE_SIZE = 25

const ACTION_LABELS: Record<ActivityAction, string> = {
  CREATE: "Buat",
  UPDATE: "Ubah",
  DELETE: "Hapus",
  LOGIN: "Login",
  LOGIN_FAILED: "Login Gagal",
  LOGOUT: "Logout",
}

function formatLogTimestamp(date: Date): string {
  const d = new Date(date)
  const datePart = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const timePart = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  const ms = String(d.getMilliseconds()).padStart(3, "0")
  return `${datePart} ${timePart}.${ms}`
}

function jsonPreview(value: unknown): string {
  if (value == null) {
    return "—"
  }
  return JSON.stringify(value)
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Label Indonesia untuk tiap kolom log. */
const COLUMN_LABELS: Record<LogColumn, string> = {
  createdAt: "Waktu",
  actorName: "Aktor",
  actorEmail: "Email aktor",
  action: "Aksi",
  entity: "Entitas",
  entityId: "ID Entitas",
  summary: "Ringkasan",
  before: "Sebelum",
  after: "Sesudah",
}

export function ActivityLogTable() {
  const [page, setPage] = useState(1)
  const [actorId, setActorId] = useState("")
  const [action, setAction] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  // Kolom terpilih dibawa antar pembukaan dialog — default semua.
  const [selected, setSelected] = useState<Set<LogColumn>>(
    () => new Set(CSV_COLUMNS)
  )

  function toggle(key: LogColumn) {
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
    setSelected(new Set(CSV_COLUMNS))
  }

  const actorsResult = useQuery(activityLogActorsQuery).data
  const actors = actorsResult?.success ? actorsResult.data ?? [] : []

  const logsResult = useQuery(
    activityLogsQuery({
      page,
      pageSize: PAGE_SIZE,
      actorId: actorId || null,
      action: (action || null) as ActivityAction | null,
      from: from ? new Date(`${from}T00:00:00.000Z`) : null,
      to: to ? new Date(`${to}T23:59:59.999Z`) : null,
    })
  ).data

  const data = logsResult?.success ? logsResult.data : null
  const logs: ActivityLogItem[] = data?.logs ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  function handleDownloadCsv() {
    if (logs.length === 0) return
    const stamp = new Date().toISOString().replace(/[:.]/g, "-")
    const cols = CSV_COLUMNS.filter((c) => selected.has(c))
    download(
      `log-manused-${stamp}.csv`,
      logsToCsv(logs, cols),
      "text/csv;charset=utf-8"
    )
    setColumnDialogOpen(false)
  }

  function handleDownloadJson() {
    if (logs.length === 0) return
    const stamp = new Date().toISOString().replace(/[:.]/g, "-")
    const cols = CSV_COLUMNS.filter((c) => selected.has(c))
    download(
      `log-manused-${stamp}.json`,
      logsToJson(logs, cols),
      "application/json;charset=utf-8"
    )
    setColumnDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm"
          value={actorId}
          onChange={(e) => {
            setActorId(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Semua aktor</option>
          {actors.map((a) => (
            <option key={a.id ?? a.email ?? "anon"} value={a.id ?? ""}>
              {a.name ?? a.email ?? "Tidak diketahui"}
            </option>
          ))}
        </select>

        <select
          className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm"
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Semua aksi</option>
          {ACTIVITY_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a]}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setPage(1)
          }}
          aria-label="Dari tanggal"
        />
        <span className="text-sm text-muted-foreground">s/d</span>
        <input
          type="date"
          className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm"
          value={to}
          onChange={(e) => {
            setTo(e.target.value)
            setPage(1)
          }}
          aria-label="Sampai tanggal"
        />

        <div className="ml-auto flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" disabled={logs.length === 0}>
                  Unduh
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setColumnDialogOpen(true)}>
                <span>Pilih Kolom…</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadCsv}>
                <span>Unduh CSV (semua)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadJson}>
                <span>Unduh JSON (semua)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Kolom Export</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selected.size} dari {CSV_COLUMNS.length} kolom dipilih
              </p>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Pilih Semua
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {CSV_COLUMNS.map((col) => (
                <label
                  key={col}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(col)}
                    onChange={() => toggle(col)}
                    className="h-4 w-4"
                  />
                  {COLUMN_LABELS[col]}
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
              <Button variant="outline" onClick={handleDownloadJson}>
                JSON
              </Button>
              <Button onClick={handleDownloadCsv}>CSV</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Waktu</TableHead>
              <TableHead>Aktor</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Entitas</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Sebelum</TableHead>
              <TableHead>Sesudah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada log aktivitas
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id} className="align-top">
                <TableCell className="text-sm whitespace-nowrap tabular-nums">
                  {formatLogTimestamp(log.createdAt)}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="block font-medium">
                    {log.actorName ?? "Tidak diketahui"}
                  </span>
                  {log.actorEmail && (
                    <span className="block text-xs text-muted-foreground">
                      {log.actorEmail}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <ActionBadge action={log.action} />
                </TableCell>
                <TableCell className="text-sm">{log.entity}</TableCell>
                <TableCell className="text-sm whitespace-normal">{log.summary}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground max-w-64 break-all whitespace-normal">
                  {jsonPreview(log.before)}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground max-w-64 break-all whitespace-normal">
                  {jsonPreview(log.after)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total} log aktivitas
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <span className="text-sm tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  )
}

const ACTION_STYLES: Record<string, string> = {
  CREATE: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
  UPDATE: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  DELETE: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
  LOGIN: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  LOGIN_FAILED: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
  LOGOUT: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action]
  return (
    <Badge variant="outline" className={style}>
      {ACTION_LABELS[action as ActivityAction] ?? action}
    </Badge>
  )
}
