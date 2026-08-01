"use server"

import prisma from "@/lib/prisma"

export async function getMembers() {
  return prisma.member.findMany({
    orderBy: { createdAt: "desc" },
  })
}
