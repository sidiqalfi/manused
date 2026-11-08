import type { JWT } from "next-auth/jwt"

interface SessionAccount {
  tokenVersion: number
  isActive: boolean
  role: "ADMIN" | "USER"
  email: string
  name: string | null
}

/** Refresh account claims only while the persisted account and token remain valid. */
export function validateAccountToken(token: JWT, account: SessionAccount | null): JWT {
  if (!account?.isActive || account.tokenVersion !== (token.tokenVersion ?? 0)) {
    return {}
  }

  return { ...token, role: account.role, email: account.email, name: account.name }
}
