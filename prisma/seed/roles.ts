import prisma from "../../src/lib/prisma"

export const roleDefs = [
  { name: "Ketua", rank: 1 },
  { name: "Wakil Ketua", rank: 2 },
  { name: "Bendahara", rank: 3 },
  { name: "Sekretaris", rank: 4 },
  { name: "Humas", rank: 5 },
  { name: "Anggota", rank: 99 },
]

export async function seedRoles() {
  for (const role of roleDefs) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { rank: role.rank },
      create: role,
    })
  }

  return prisma.role.count()
}
