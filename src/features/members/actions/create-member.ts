"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import {
  createMemberSchema,
  getMemberFormValues,
} from "@/features/members/member-schemas"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/features/log/activity-log"

const DEFAULT_ROLE_NAME = "Anggota"

export async function createMember(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const createdById = session.user.id
  const actor = {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  }

  const parsedMember = createMemberSchema.safeParse(
    getMemberFormValues(formData),
  )

  if (!parsedMember.success) {
    return { error: "Data anggota tidak valid" }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          ...parsedMember.data,
          createdById,
        },
      })

      await logActivity(tx, {
        actor,
        action: "CREATE",
        entity: "member",
        entityId: member.id,
        summary: "Menambahkan anggota",
        after: { name: member.name, fullName: member.fullName },
      })

      const anggotaRole = await tx.role.findUnique({
        where: { name: DEFAULT_ROLE_NAME },
      })

      if (!anggotaRole) {
        console.warn(
          `Role "${DEFAULT_ROLE_NAME}" tidak ditemukan saat menambah anggota`,
        )
        return
      }

      await tx.memberRoleAssignment.create({
        data: {
          memberId: member.id,
          roleId: anggotaRole.id,
        },
      })
    })

    revalidatePath("/dashboard/members")
    return { success: true }
  } catch {
    return { error: "Gagal menambahkan anggota" }
  }
}
