"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import {
  createMemberSchema,
  getMemberFormValues,
} from "@/features/members/member-schemas"
import { revalidatePath } from "next/cache"

export async function createMember(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const parsedMember = createMemberSchema.safeParse(
    getMemberFormValues(formData),
  )

  if (!parsedMember.success) {
    return { error: "Data anggota tidak valid" }
  }

  try {
    await prisma.member.create({
      data: {
        ...parsedMember.data,
        createdById: session.user.id,
      },
    })

    revalidatePath("/dashboard/members")
    return { success: true }
  } catch {
    return { error: "Gagal menambahkan anggota" }
  }
}
