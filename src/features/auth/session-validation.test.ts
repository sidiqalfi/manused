import assert from "node:assert/strict"
import { test } from "node:test"
import { validateAccountToken } from "./lib/session-validation"

const account = { tokenVersion: 3, isActive: true, role: "ADMIN" as const, email: "admin@example.com", name: "Admin" }

test("session validation rejects missing, disabled, and revoked accounts", () => {
  const token = { id: "account-id", tokenVersion: 3, role: "ADMIN" as const }
  assert.deepEqual(validateAccountToken(token, null), {})
  assert.deepEqual(validateAccountToken(token, { ...account, isActive: false }), {})
  assert.deepEqual(validateAccountToken({ ...token, tokenVersion: 2 }, account), {})
})

test("session claims follow persisted role and identity", () => {
  const token = validateAccountToken({ id: "account-id", tokenVersion: 3, role: "USER", name: "Lama" }, account)
  assert.equal(token.role, "ADMIN")
  assert.equal(token.name, "Admin")
  assert.equal(token.email, "admin@example.com")
})

test("legacy token without a version is accepted only for version zero", () => {
  assert.deepEqual(validateAccountToken({ id: "legacy" }, account), {})
  assert.equal(validateAccountToken({ id: "legacy" }, { ...account, tokenVersion: 0 }).id, "legacy")
})
