import type { Prisma } from "@/generated/prisma/client"

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

export type ManagedUser = Prisma.UserGetPayload<{ select: typeof userSelect }>

export interface UserActionResult {
  success: boolean
  error?: string
  sessionRevoked?: boolean
}
