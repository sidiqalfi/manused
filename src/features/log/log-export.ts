import type { ActivityLogItem } from "./actions/get-activity-logs"

export const CSV_COLUMNS = [
  "createdAt",
  "actorName",
  "actorEmail",
  "action",
  "entity",
  "entityId",
  "summary",
  "before",
  "after",
] as const

export type LogColumn = (typeof CSV_COLUMNS)[number]

function formatTimestamp(date: Date): string {
  return date.toISOString().replace("T", " ").replace("Z", "")
}

function jsonToCell(value: unknown): string {
  if (value == null) {
    return ""
  }
  const json = JSON.stringify(value)
  return `"${json.replace(/"/g, '""')}"`
}

function csvCell(value: unknown): string {
  if (value == null) {
    return ""
  }
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function toRow(log: ActivityLogItem): Record<LogColumn, unknown> {
  return {
    createdAt: formatTimestamp(log.createdAt),
    actorName: log.actorName,
    actorEmail: log.actorEmail,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    summary: log.summary,
    before: log.before,
    after: log.after,
  }
}

function toCells(log: ActivityLogItem, columns: readonly LogColumn[]): string[] {
  const row = toRow(log)
  return columns.map((col) => {
    switch (col) {
      case "before":
        return jsonToCell(row.before)
      case "after":
        return jsonToCell(row.after)
      default:
        return csvCell(row[col])
    }
  })
}

export function logsToCsv(
  logs: ActivityLogItem[],
  columns: readonly LogColumn[] = CSV_COLUMNS
): string {
  const header = columns.join(",")
  const rows = logs.map((log) => toCells(log, columns).join(","))

  return [header, ...rows].join("\n")
}

export function logsToJson(
  logs: ActivityLogItem[],
  columns: readonly LogColumn[] = CSV_COLUMNS
): string {
  return JSON.stringify(
    logs.map((log) => {
      const row = toRow(log)
      const picked: Partial<Record<LogColumn, unknown>> = {}
      for (const col of columns) {
        picked[col] = row[col]
      }
      return picked
    }),
    null,
    2
  )
}
