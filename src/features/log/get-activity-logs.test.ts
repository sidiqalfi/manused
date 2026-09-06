import assert from "node:assert/strict"
import { mock, test } from "node:test"

const findMany = mock.fn(async () => [])
const count = mock.fn(async () => 0)

function mockModule(
  specifier: string,
  options: { exports: Record<string, unknown> },
) {
  mock.module(specifier, options as never)
}

mockModule("@/lib/prisma", {
  exports: {
    default: {
      activityLog: {
        findMany,
        count,
      },
    },
  },
})

test("getActivityLogs rejects an invalid page", async () => {
  const { getActivityLogs } = await import("./actions/get-activity-logs")

  const result = await getActivityLogs({ page: 0 })

  assert.equal(result.error, "Data filter tidak valid")
  assert.equal(findMany.mock.callCount(), 0)
})

test("getActivityLogs returns empty page shape on success", async () => {
  const { getActivityLogs } = await import("./actions/get-activity-logs")

  const result = await getActivityLogs({ page: 1, action: "DELETE" })

  assert.equal(result.success, true)
  assert.deepEqual(result.success ? result.data : null, {
    logs: [],
    total: 0,
    page: 1,
    pageSize: 25,
    totalPages: 0,
  })
  assert.equal(findMany.mock.callCount(), 1)
  const args = findMany.mock.calls[0]?.arguments as unknown as [
    { where: Record<string, unknown> },
  ]
  assert.equal(args[0].where.action, "DELETE")
})
