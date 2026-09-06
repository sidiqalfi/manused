import assert from "node:assert/strict"
import { test } from "node:test"
import { followersOf, householdHeads, isHead } from "./household"

const HEAD = "9dfac38b-7e4c-4a6c-b296-068995e89cb9"

const members = [
  { id: "a", name: "Sidiq", headOfHouseholdId: null },
  { id: "b", name: "Rasyid", headOfHouseholdId: HEAD },
  { id: "c", name: "Dimas", headOfHouseholdId: HEAD },
]

test("isHead treats null/undefined headOfHouseholdId as a household head", () => {
  assert.equal(isHead({ headOfHouseholdId: null }), true)
  assert.equal(isHead({}), true)
  assert.equal(isHead({ headOfHouseholdId: HEAD }), false)
})

test("householdHeads returns only members without a head", () => {
  assert.deepEqual(
    householdHeads(members).map((m) => m.name),
    ["Sidiq"],
  )
})

test("followersOf returns members that point at a given head", () => {
  assert.deepEqual(
    followersOf(HEAD, members).map((m) => m.name),
    ["Rasyid", "Dimas"],
  )
})

test("followersOf returns an empty list for unknown heads", () => {
  assert.deepEqual(followersOf("unknown", members), [])
})
