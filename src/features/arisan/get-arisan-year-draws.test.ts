import assert from "node:assert/strict"
import { mock, test } from "node:test"

const drawFindMany = mock.fn(async () => [
  {
    id: "draw-1",
    cycleNumber: 1,
    collectedAmount: 10000,
    payoutAmount: 135000,
    savingsAfter: -25000,
    drawnAt: new Date("2026-08-24"),
    voided: false,
    winnerMember: { name: "Agnes" },
    period: { month: 8, year: 2026 },
  },
])

function mockModule(
  specifier: string,
  options: { exports: Record<string, unknown> },
) {
  mock.module(specifier, options as never)
}

mockModule("@/lib/prisma", {
  exports: {
    default: {
      arisanDraw: {
        findMany: drawFindMany,
      },
    },
  },
})

test("getArisanYearDraws rejects an invalid year", async () => {
  const { getArisanYearDraws } = await import(
    "./actions/get-arisan-year-draws"
  )

  const result = await getArisanYearDraws(2019)

  assert.equal(result.error, "Tahun tidak valid")
  assert.equal(drawFindMany.mock.callCount(), 0)
})

test("getArisanYearDraws returns draws flattened with period info", async () => {
  const { getArisanYearDraws } = await import(
    "./actions/get-arisan-year-draws"
  )

  const result = await getArisanYearDraws(2026)

  assert.equal(result.success, true)
  assert.deepEqual(result.success ? result.data : null, [
    {
      id: "draw-1",
      winnerName: "Agnes",
      cycleNumber: 1,
      collectedAmount: 10000,
      payoutAmount: 135000,
      savingsAfter: -25000,
      drawnAt: new Date("2026-08-24"),
      voided: false,
      period: { month: 8, year: 2026 },
    },
  ])
  assert.equal(drawFindMany.mock.callCount(), 1)
})
