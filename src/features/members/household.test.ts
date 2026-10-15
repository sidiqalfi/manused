import assert from "node:assert/strict"
import { test } from "node:test"
import {
  activeSlotHeads,
  followersOf,
  hasActiveSlot,
  householdHeads,
  isHead,
} from "./household"

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

// Slot = keluarga, bukan orang: head inactive tetap "hidup" selama
// ada anggota rumahnya yang aktif.
const slots = [
  { id: "h1", headOfHouseholdId: null, status: "ACTIVE" },
  { id: "h2", headOfHouseholdId: null, status: "INACTIVE" },
  { id: "h2a", headOfHouseholdId: "h2", status: "ACTIVE" },
  { id: "h3", headOfHouseholdId: null, status: "INACTIVE" },
  { id: "h3a", headOfHouseholdId: "h3", status: "INACTIVE" },
  { id: "h4", headOfHouseholdId: null, status: "INACTIVE" },
  { id: "f1", headOfHouseholdId: "h1", status: "ACTIVE" },
]

test("hasActiveSlot: active head has an active slot", () => {
  assert.equal(hasActiveSlot(slots[0], slots), true)
})

test("hasActiveSlot: inactive head with an active follower keeps its slot", () => {
  assert.equal(hasActiveSlot(slots[1], slots), true)
})

test("hasActiveSlot: inactive head with only inactive followers loses its slot", () => {
  assert.equal(hasActiveSlot(slots[3], slots), false)
})

test("hasActiveSlot: inactive head without followers loses its slot", () => {
  assert.equal(hasActiveSlot(slots[5], slots), false)
})

test("hasActiveSlot: follower never counts as a slot", () => {
  assert.equal(hasActiveSlot(slots[6], slots), false)
})

test("activeSlotHeads filters to heads with active slots only", () => {
  assert.deepEqual(
    activeSlotHeads(slots).map((m) => m.id),
    ["h1", "h2"],
  )
})
