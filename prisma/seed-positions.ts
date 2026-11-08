import prisma from "../src/lib/prisma"
import { seedPositions } from "./seed/positions"

async function main() {
  const count = await seedPositions()
  console.log(`SUCCESS_POSITIONS_SEEDED: ${count} positions`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
