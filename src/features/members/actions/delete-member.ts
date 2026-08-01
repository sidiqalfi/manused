"use server"

import prisma from "@/lib/prisma"
import { auth } from "@features/auth/lib/auth"
import { revalidatePath } from "next/cache"

export async function deleteMember(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  if (!id) {
    return { error: "ID anggota tidak valid" }
  }

  try {
    await prisma.member.delete({ where: { id } })
    revalidatePath("/dashboard/members")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus anggota" }
  }
}
