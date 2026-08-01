"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { revalidatePath } from "next/cache"

export async function createMember(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const fullName = formData.get("fullName") as string
  const gender = formData.get("gender") as "MALE" | "FEMALE"
  const birthDate = formData.get("birthDate") as string
  const address = formData.get("address") as string
  const phone = (formData.get("phone") as string) || null

  if (!name || !fullName || !gender || !birthDate || !address) {
    return { error: "Semua field wajib diisi" }
  }

  try {
    await prisma.member.create({
      data: {
        name,
        fullName,
        gender,
        birthDate: new Date(birthDate),
        address,
        phone,
        createdById: session.user.id,
      },
    })

    revalidatePath("/dashboard/members")
    return { success: true }
  } catch {
    return { error: "Gagal menambahkan anggota" }
  }
}
