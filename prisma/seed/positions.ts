import prisma from "../../src/lib/prisma"

export const positionDefs = [
  { name: "Ketua", rank: 1 },
  { name: "Wakil Ketua", rank: 2 },
  { name: "Bendahara", rank: 3 },
  { name: "Sekretaris", rank: 4 },
  { name: "Humas", rank: 5 },
  { name: "Anggota", rank: 99 },
]

export async function seedPositions() {
  for (const position of positionDefs) {
    await prisma.position.upsert({
      where: { name: position.name },
      update: { rank: position.rank },
      create: position,
    })
  }

  return prisma.position.count()
}
