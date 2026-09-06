"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import {
  getMemberFormValues,
  memberIdSchema,
  updateMemberSchema,
} from "@/features/members/member-schemas"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/features/log/activity-log"

export async function updateMember(id: string, formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsedId = memberIdSchema.safeParse(id)

  if (!parsedId.success) {
    return { error: "ID anggota tidak valid" }
  }

  const parsedMember = updateMemberSchema.safeParse(
    getMemberFormValues(formData),
  )

  if (!parsedMember.success) {
    return { error: "Data anggota tidak valid" }
  }

  try {
    const existing = await prisma.member.findUnique({
      where: { id: parsedId.data },
      select: {
        name: true,
        fullName: true,
        gender: true,
        status: true,
        headOfHouseholdId: true,
      },
    })

    await prisma.member.update({
      where: { id: parsedId.data },
      data: parsedMember.data,
    })

    await logActivity(prisma, {
      actor: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
      action: "UPDATE",
      entity: "member",
      entityId: parsedId.data,
      summary: "Mengubah data anggota",
      before: existing,
      after: {
        name: parsedMember.data.name,
        fullName: parsedMember.data.fullName,
        gender: parsedMember.data.gender,
        status: parsedMember.data.status,
        headOfHouseholdId: parsedMember.data.headOfHouseholdId,
        birthDate: parsedMember.data.birthDate.toISOString(),
      },
    })

    revalidatePath("/dashboard/members")
    return { success: true }
  } catch {
    return { error: "Gagal mengubah data anggota" }
  }
}
