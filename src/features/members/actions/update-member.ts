"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import {
  getMemberFormValues,
  memberIdSchema,
  updateMemberSchema,
} from "@/features/members/member-schemas"
import { revalidatePath } from "next/cache"

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
    await prisma.member.update({
      where: { id: parsedId.data },
      data: parsedMember.data,
    })

    revalidatePath("/dashboard/members")
    return { success: true }
  } catch {
    return { error: "Gagal mengubah data anggota" }
  }
}
