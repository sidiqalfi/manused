"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { isGuestSession, GUEST_WRITE_ERROR } from "@/features/auth/lib/guards"
import { revalidatePath } from "next/cache"
import { updateMemberPositionsSchema } from "@/features/positions/position-schemas"
import { logActivity } from "@/features/log/activity-log"

export async function updateMemberPositions(
  memberId: string,
  positionIds: string[],
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }
  if (isGuestSession(session)) {
    return { error: GUEST_WRITE_ERROR }
  }

  const parsed = updateMemberPositionsSchema.safeParse({ memberId, positionIds })

  if (!parsed.success) {
    return { error: "Data jabatan tidak valid" }
  }

  const { memberId: mid, positionIds: rids } = parsed.data
  const actor = {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  }
  const desired = new Set(rids)
  const today = new Date()

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.memberPositionAssignment.findMany({
        where: { memberId: mid, endDate: null },
        select: { id: true, positionId: true },
      })

      const currentPositionIds = new Set(current.map((c) => c.positionId))

      const toDeactivate = current.filter((c) => !desired.has(c.positionId))
      const toAdd = rids.filter((r) => !currentPositionIds.has(r))

      if (toDeactivate.length > 0) {
        await tx.memberPositionAssignment.updateMany({
          where: { id: { in: toDeactivate.map((c) => c.id) } },
          data: { endDate: today },
        })
      }

      if (toAdd.length > 0) {
        await tx.memberPositionAssignment.createMany({
          data: toAdd.map((positionId) => ({
            memberId: mid,
            positionId,
            startDate: today,
          })),
        })
      }

      await logActivity(tx, {
        actor,
        action: "UPDATE",
        entity: "memberPositionAssignment",
        entityId: mid,
        summary: "Mengubah jabatan anggota",
        before: { positionIds: [...currentPositionIds] },
        after: { positionIds: rids },
      })
    })

    revalidatePath("/dashboard/members")
    return { success: true }
  } catch (error) {
    console.error("Failed to update member positions:", error)
    return { error: "Gagal mengubah jabatan anggota" }
  }
}
