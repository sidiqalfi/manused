"use server"

import { auth } from "@/features/auth/lib/auth"
import { ADMIN_ACCESS_ERROR, getAdministrator } from "@/features/auth/lib/administrator"
import prisma from "@/lib/prisma"
import { type ManagedUser, userSelect } from "../user-select"

export interface GetUsersResult {
  success: boolean
  data?: ManagedUser[]
  error?: string
}

export async function getUsers(): Promise<GetUsersResult> {
  try {
    if (!await getAdministrator(await auth())) return { success: false, error: ADMIN_ACCESS_ERROR }
    const users = await prisma.user.findMany({ select: userSelect, orderBy: [{ createdAt: "desc" }, { id: "asc" }] })
    return { success: true, data: users }
  } catch {
    return { success: false, error: "Gagal memuat pengguna. Silakan coba lagi." }
  }
}
