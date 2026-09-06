import type { ActivityLogItem } from "./actions/get-activity-logs"

const CSV_COLUMNS = [
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

export function logsToCsv(logs: ActivityLogItem[]): string {
  const header = CSV_COLUMNS.join(",")
  const rows = logs.map((log) => {
    return CSV_COLUMNS.map((col) => {
      switch (col) {
        case "createdAt":
          return csvCell(formatTimestamp(log.createdAt))
        case "before":
          return jsonToCell(log.before)
        case "after":
          return jsonToCell(log.after)
        default:
          return csvCell(log[col])
      }
    }).join(",")
  })

  return [header, ...rows].join("\n")
}

export function logsToJson(logs: ActivityLogItem[]): string {
  return JSON.stringify(
    logs.map((log) => ({
      ...log,
      createdAt: formatTimestamp(log.createdAt),
    })),
    null,
    2
  )
}
