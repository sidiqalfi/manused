"use server"

import prisma from "@/lib/prisma"
import { auth } from "@features/auth/lib/auth"
import { memberIdSchema } from "@/features/members/member-schemas"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/features/log/activity-log"

export async function deleteMember(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsedId = memberIdSchema.safeParse(id)

  if (!parsedId.success) {
    return { error: "ID anggota tidak valid" }
  }

  try {
    const existing = await prisma.member.findUnique({
      where: { id: parsedId.data },
      select: { name: true, fullName: true },
    })

    await prisma.member.delete({ where: { id: parsedId.data } })

    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "DELETE",
      entity: "member",
      entityId: parsedId.data,
      summary: "Menghapus anggota",
      before: existing,
    })

    revalidatePath("/dashboard/members")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus anggota" }
  }
}
