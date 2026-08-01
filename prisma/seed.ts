import bcrypt from "bcryptjs"
import prisma from "../src/lib/prisma"

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

  // Seed Members (Pemuda Pemudi Desa)
  const members = [
    {
      name: "Andi",
      fullName: "Andi Prasetyo",
      gender: "MALE" as const,
      birthDate: new Date("2002-03-15"),
      address: "Dusun Krajan RT 01/RW 02",
      phone: "081234567890",
    },
    {
      name: "Sari",
      fullName: "Sari Wulandari",
      gender: "FEMALE" as const,
      birthDate: new Date("2003-07-22"),
      address: "Dusun Krajan RT 01/RW 02",
      phone: "081234567891",
    },
    {
      name: "Budi",
      fullName: "Budi Santoso",
      gender: "MALE" as const,
      birthDate: new Date("2001-11-08"),
      address: "Dusun Ngasem RT 02/RW 01",
      phone: "081234567892",
    },
    {
      name: "Dewi",
      fullName: "Dewi Lestari",
      gender: "FEMALE" as const,
      birthDate: new Date("2004-01-30"),
      address: "Dusun Ngasem RT 02/RW 01",
      phone: null,
    },
    {
      name: "Rizky",
      fullName: "Rizky Ramadhan",
      gender: "MALE" as const,
      birthDate: new Date("2002-09-17"),
      address: "Dusun Sidorejo RT 03/RW 01",
      phone: "081234567894",
    },
    {
      name: "Putri",
      fullName: "Putri Ayu Ningrum",
      gender: "FEMALE" as const,
      birthDate: new Date("2003-04-21"),
      address: "Dusun Sidorejo RT 03/RW 01",
      phone: "081234567895",
    },
    {
      name: "Fajar",
      fullName: "Fajar Nugroho",
      gender: "MALE" as const,
      birthDate: new Date("2000-12-05"),
      address: "Dusun Krajan RT 01/RW 01",
      phone: "081234567896",
    },
    {
      name: "Nisa",
      fullName: "Annisa Fitri Handayani",
      gender: "FEMALE" as const,
      birthDate: new Date("2005-06-14"),
      address: "Dusun Krajan RT 01/RW 01",
      phone: null,
    },
    {
      name: "Dimas",
      fullName: "Dimas Arya Pratama",
      gender: "MALE" as const,
      birthDate: new Date("2001-08-25"),
      address: "Dusun Ngasem RT 02/RW 02",
      phone: "081234567898",
    },
    {
      name: "Lina",
      fullName: "Lina Marlina",
      gender: "FEMALE" as const,
      birthDate: new Date("2004-10-03"),
      address: "Dusun Sidorejo RT 03/RW 02",
      phone: "081234567899",
    },
  ]

  // Hapus member lama, lalu buat ulang
  await prisma.member.deleteMany()

  await prisma.member.createMany({
    data: members.map((member) => ({
      ...member,
      createdById: user.id,
    })),
  })

  const memberCount = await prisma.member.count()
  console.log(`SUCCESS_MEMBERS_SEEDED: ${memberCount} members total`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
