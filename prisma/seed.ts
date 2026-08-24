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
      address: "Krajan",
      rt: "001",
      rw: "002",
      phone: "081234567890",
    },
    {
      name: "Sari",
      fullName: "Sari Wulandari",
      gender: "FEMALE" as const,
      birthDate: new Date("2003-07-22"),
      address: "Krajan",
      rt: "001",
      rw: "002",
      phone: "081234567891",
    },
    {
      name: "Budi",
      fullName: "Budi Santoso",
      gender: "MALE" as const,
      birthDate: new Date("2001-11-08"),
      address: "Ngasem",
      rt: "002",
      rw: "001",
      phone: "081234567892",
    },
    {
      name: "Dewi",
      fullName: "Dewi Lestari",
      gender: "FEMALE" as const,
      birthDate: new Date("2004-01-30"),
      address: "Ngasem",
      rt: "002",
      rw: "001",
      phone: null,
    },
    {
      name: "Rizky",
      fullName: "Rizky Ramadhan",
      gender: "MALE" as const,
      birthDate: new Date("2002-09-17"),
      address: "Sidorejo",
      rt: "003",
      rw: "001",
      phone: "081234567894",
    },
    {
      name: "Putri",
      fullName: "Putri Ayu Ningrum",
      gender: "FEMALE" as const,
      birthDate: new Date("2003-04-21"),
      address: "Sidorejo",
      rt: "003",
      rw: "001",
      phone: "081234567895",
    },
    {
      name: "Fajar",
      fullName: "Fajar Nugroho",
      gender: "MALE" as const,
      birthDate: new Date("2000-12-05"),
      address: "Krajan",
      rt: "001",
      rw: "001",
      phone: "081234567896",
    },
    {
      name: "Nisa",
      fullName: "Annisa Fitri Handayani",
      gender: "FEMALE" as const,
      birthDate: new Date("2005-06-14"),
      address: "Krajan",
      rt: "001",
      rw: "001",
      phone: null,
    },
    {
      name: "Dimas",
      fullName: "Dimas Arya Pratama",
      gender: "MALE" as const,
      birthDate: new Date("2001-08-25"),
      address: "Ngasem",
      rt: "002",
      rw: "002",
      phone: "081234567898",
    },
    {
      name: "Lina",
      fullName: "Lina Marlina",
      gender: "FEMALE" as const,
      birthDate: new Date("2004-10-03"),
      address: "Sidorejo",
      rt: "003",
      rw: "002",
      phone: "081234567899",
    },
  ]

  // Hapus data kas lama dulu (FK ke member/period), lalu member
  await prisma.cashIncome.deleteMany()
  await prisma.cashExpense.deleteMany()
  await prisma.cashPeriod.deleteMany()
  await prisma.member.deleteMany()

  await prisma.member.createMany({
    data: members.map((member) => ({
      ...member,
      createdById: user.id,
    })),
  })

  const memberCount = await prisma.member.count()
  console.log(`SUCCESS_MEMBERS_SEEDED: ${memberCount} members total`)

  // Seed Cash Periods (12 bulan tahun berjalan)
  const year = new Date().getFullYear()
  const dbMembers = await prisma.member.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  const DUES = 5000
  const MIN = 3000

  await prisma.cashPeriod.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      year,
      duesAmount: DUES,
      minAmount: MIN,
      createdById: user.id,
    })),
  })

  const dbPeriods = await prisma.cashPeriod.findMany({
    where: { year },
    orderBy: { month: "asc" },
  })

  const expenseTemplates = [
    { description: "Konsumsi rapat rutin", amount: 10000 },
    { description: "Pembelian ATK", amount: 8000 },
    { description: "Iuran kebersihan", amount: 5000 },
    { description: "Dekorasi & konsumsi acara", amount: 15000 },
    { description: "Dana sosial", amount: 7000 },
  ]

  const incomes: {
    periodId: string
    memberId: string
    amount: number
    paidAt: Date
    note: string | null
    createdById: string
  }[] = []
  const expenses: {
    periodId: string
    description: string
    amount: number
    spentAt: Date
    createdById: string
  }[] = []

  for (const period of dbPeriods) {
    const payingCount = 8 + (period.month % 3) // 8-10 member bayar tiap bulan
    for (let i = 0; i < payingCount; i++) {
      const member = dbMembers[i % dbMembers.length]
      if (!member) continue
      incomes.push({
        periodId: period.id,
        memberId: member.id,
        amount: DUES,
        paidAt: new Date(year, period.month - 1, 5),
        note: null,
        createdById: user.id,
      })
    }

    const expenseCount = 1 + (period.month % 2) // 1-2 pengeluaran tiap bulan
    for (let j = 0; j < expenseCount; j++) {
      const template = expenseTemplates[(period.month + j) % expenseTemplates.length]
      expenses.push({
        periodId: period.id,
        description: template.description,
        amount: template.amount,
        spentAt: new Date(year, period.month - 1, 15 + j * 5),
        createdById: user.id,
      })
    }
  }

  await prisma.cashIncome.createMany({ data: incomes })
  await prisma.cashExpense.createMany({ data: expenses })

  console.log(`SUCCESS_CASH_SEEDED: ${dbPeriods.length} periods (${year}), ${incomes.length} incomes, ${expenses.length} expenses`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
