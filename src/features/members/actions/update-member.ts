"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/features/auth/lib/auth"
import { revalidatePath } from "next/cache"

export async function updateMember(id: string, formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  if (!id) {
    return { error: "ID anggota tidak valid" }
  }

  const name = formData.get("name") as string
  const fullName = formData.get("fullName") as string
  const gender = formData.get("gender") as "MALE" | "FEMALE"
  const birthDate = formData.get("birthDate") as string
  const address = formData.get("address") as string
  const phone = (formData.get("phone") as string) || null
  const status = formData.get("status") as "ACTIVE" | "INACTIVE"

  if (!name || !fullName || !gender || !birthDate || !address || !status) {
    return { error: "Semua field wajib diisi (kecuali No. HP)" }
  }

  try {
    await prisma.member.update({
      where: { id },
      data: {
        name,
        fullName,
        gender,
        birthDate: new Date(birthDate),
        address,
        phone,
        status,
      },
    })

    revalidatePath("/dashboard/members")
    return { success: true }
  } catch {
    return { error: "Gagal mengubah data anggota" }
  }
}
