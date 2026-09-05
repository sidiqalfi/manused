import prisma from "../src/lib/prisma"
import { seedRoles } from "./seed/roles"

async function main() {
  const count = await seedRoles()
  console.log(`SUCCESS_ROLES_SEEDED: ${count} roles`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
