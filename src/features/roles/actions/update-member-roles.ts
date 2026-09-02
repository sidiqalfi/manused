"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { revalidatePath } from "next/cache"
import { updateMemberRolesSchema } from "@/features/roles/role-schemas"

export async function updateMemberRoles(
  memberId: string,
  roleIds: string[],
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsed = updateMemberRolesSchema.safeParse({ memberId, roleIds })

  if (!parsed.success) {
    return { error: "Data role tidak valid" }
  }

  const { memberId: mid, roleIds: rids } = parsed.data
  const desired = new Set(rids)
  const today = new Date()

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.memberRoleAssignment.findMany({
        where: { memberId: mid, endDate: null },
        select: { id: true, roleId: true },
      })

      const currentRoleIds = new Set(current.map((c) => c.roleId))

      const toDeactivate = current.filter((c) => !desired.has(c.roleId))
      const toAdd = rids.filter((r) => !currentRoleIds.has(r))

      if (toDeactivate.length > 0) {
        await tx.memberRoleAssignment.updateMany({
          where: { id: { in: toDeactivate.map((c) => c.id) } },
          data: { endDate: today },
        })
      }

      if (toAdd.length > 0) {
        await tx.memberRoleAssignment.createMany({
          data: toAdd.map((roleId) => ({
            memberId: mid,
            roleId,
            startDate: today,
          })),
        })
      }
    })

    revalidatePath("/dashboard/members")
    return { success: true }
  } catch (error) {
    console.error("Failed to update member roles:", error)
    return { error: "Gagal mengubah role anggota" }
  }
}
