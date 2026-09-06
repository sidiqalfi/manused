"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ACTIVITY_ACTIONS, type ActivityAction } from "../activity-log"
import { activityLogsQuery, activityLogActorsQuery } from "../queries"
import { logsToCsv, logsToJson } from "../log-export"
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

export function ActivityLogTable() {
  const [page, setPage] = useState(1)
  const [actorId, setActorId] = useState("")
  const [action, setAction] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

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
    download(`log-manused-${stamp}.csv`, logsToCsv(logs), "text/csv;charset=utf-8")
  }

  function handleDownloadJson() {
    if (logs.length === 0) return
    const stamp = new Date().toISOString().replace(/[:.]/g, "-")
    download(
      `log-manused-${stamp}.json`,
      logsToJson(logs),
      "application/json;charset=utf-8"
    )
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
          <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
            Unduh CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadJson}>
            Unduh JSON
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Waktu</th>
              <th className="p-3 text-left text-sm font-medium">Aktor</th>
              <th className="p-3 text-left text-sm font-medium">Aksi</th>
              <th className="p-3 text-left text-sm font-medium">Entitas</th>
              <th className="p-3 text-left text-sm font-medium">Keterangan</th>
              <th className="p-3 text-left text-sm font-medium">Sebelum</th>
              <th className="p-3 text-left text-sm font-medium">Sesudah</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-sm text-muted-foreground">
                  Belum ada log aktivitas
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b align-top">
                <td className="p-3 text-sm whitespace-nowrap tabular-nums">
                  {formatLogTimestamp(log.createdAt)}
                </td>
                <td className="p-3 text-sm">
                  <span className="block font-medium">
                    {log.actorName ?? "Tidak diketahui"}
                  </span>
                  {log.actorEmail && (
                    <span className="block text-xs text-muted-foreground">
                      {log.actorEmail}
                    </span>
                  )}
                </td>
                <td className="p-3 text-sm">
                  <Badge variant={log.action === "LOGIN_FAILED" ? "destructive" : "outline"}>
                    {ACTION_LABELS[log.action as ActivityAction] ?? log.action}
                  </Badge>
                </td>
                <td className="p-3 text-sm">{log.entity}</td>
                <td className="p-3 text-sm">{log.summary}</td>
                <td className="p-3 text-xs font-mono text-muted-foreground max-w-64 break-all">
                  {jsonPreview(log.before)}
                </td>
                <td className="p-3 text-xs font-mono text-muted-foreground max-w-64 break-all">
                  {jsonPreview(log.after)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
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
