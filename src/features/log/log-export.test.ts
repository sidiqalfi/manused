import assert from "node:assert/strict"
import test from "node:test"
import { logsToCsv, logsToJson } from "./log-export"
import type { ActivityLogItem } from "./actions/get-activity-logs"

const logs: ActivityLogItem[] = [
  {
    id: "1",
    actorId: "a",
    actorName: "Sidiq",
    actorEmail: "sidiq@example.com",
    action: "UPDATE",
    entity: "cashIncome",
    entityId: "b",
    summary: "Mengubah pembayaran",
    before: { amount: 5000 },
    after: { amount: 7000, note: 'catatan, "penting"' },
    createdAt: new Date("2026-09-06T12:34:56.789Z"),
  },
]

test("logsToCsv produces a header and escaped before/after cells", () => {
  const csv = logsToCsv(logs)
  const lines = csv.split("\n")

  assert.equal(lines.length, 2)
  assert.match(lines[0], /^createdAt,actorName/)
  assert.ok(lines[1].includes("2026-09-06 12:34:56.789"))
  assert.ok(lines[1].includes("5000"))
  assert.ok(lines[1].includes("7000"))
  assert.ok(lines[1].includes("catatan"))
  assert.ok(lines[1].includes("penting"))
})

test("logsToJson serializes timestamps as ISO strings", () => {
  const parsed = JSON.parse(logsToJson(logs)) as Array<Record<string, unknown>>

  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].createdAt, "2026-09-06 12:34:56.789")
  assert.deepEqual(parsed[0].after, { amount: 7000, note: 'catatan, "penting"' })
})
