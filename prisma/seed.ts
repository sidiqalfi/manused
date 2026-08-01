import bcrypt from "bcryptjs"
import prisma from "./client"

async function main() {
  const hashedPassword = await bcrypt.hash("12345678", 10)
  const user = await prisma.user.upsert({
    where: { email: "johndoe@gmail.com" },
    update: {
      name: "john",
      password: hashedPassword,
    },
    create: {
      email: "johndoe@gmail.com",
      name: "john",
      password: hashedPassword,
    },
  })
  console.log("SUCCESS_USER_UPSERTED:", JSON.stringify({ id: user.id, email: user.email, name: user.name }))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
