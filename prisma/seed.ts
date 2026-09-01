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
    {
      name: "Eko",
      fullName: "Eko Prasetyo",
      gender: "MALE" as const,
      birthDate: new Date("2002-01-12"),
      address: "Krajan",
      rt: "001",
      rw: "002",
      phone: "081234567900",
    },
    {
      name: "Rina",
      fullName: "Rina Oktaviani",
      gender: "FEMALE" as const,
      birthDate: new Date("2003-02-20"),
      address: "Ngasem",
      rt: "002",
      rw: "001",
      phone: "081234567901",
    },
    {
      name: "Galih",
      fullName: "Galih Permana",
      gender: "MALE" as const,
      birthDate: new Date("2001-03-18"),
      address: "Sidorejo",
      rt: "003",
      rw: "001",
      phone: "081234567902",
    },
    {
      name: "Sinta",
      fullName: "Sinta Nurhaliza",
      gender: "FEMALE" as const,
      birthDate: new Date("2004-04-25"),
      address: "Krajan",
      rt: "001",
      rw: "001",
      phone: "081234567903",
    },
    {
      name: "Arif",
      fullName: "Arif Hidayat",
      gender: "MALE" as const,
      birthDate: new Date("2000-05-09"),
      address: "Ngasem",
      rt: "002",
      rw: "002",
      phone: "081234567904",
    },
    {
      name: "Maya",
      fullName: "Maya Anggraini",
      gender: "FEMALE" as const,
      birthDate: new Date("2003-06-14"),
      address: "Sidorejo",
      rt: "003",
      rw: "002",
      phone: null,
    },
    {
      name: "Yoga",
      fullName: "Yoga Pratama",
      gender: "MALE" as const,
      birthDate: new Date("2002-07-30"),
      address: "Krajan",
      rt: "001",
      rw: "002",
      phone: "081234567906",
    },
    {
      name: "Tari",
      fullName: "Tari Wulandari",
      gender: "FEMALE" as const,
      birthDate: new Date("2005-08-11"),
      address: "Ngasem",
      rt: "002",
      rw: "001",
      phone: "081234567907",
    },
    {
      name: "Bayu",
      fullName: "Bayu Saputra",
      gender: "MALE" as const,
      birthDate: new Date("2001-09-03"),
      address: "Sidorejo",
      rt: "003",
      rw: "001",
      phone: "081234567908",
    },
    {
      name: "Wulan",
      fullName: "Wulan Sari",
      gender: "FEMALE" as const,
      birthDate: new Date("2004-10-27"),
      address: "Krajan",
      rt: "001",
      rw: "001",
      phone: null,
    },
    {
      name: "Hendra",
      fullName: "Hendra Gunawan",
      gender: "MALE" as const,
      birthDate: new Date("2000-11-15"),
      address: "Ngasem",
      rt: "002",
      rw: "002",
      phone: "081234567910",
    },
    {
      name: "Fitri",
      fullName: "Fitri Handayani",
      gender: "FEMALE" as const,
      birthDate: new Date("2003-12-08"),
      address: "Sidorejo",
      rt: "003",
      rw: "002",
      phone: "081234567911",
    },
    {
      name: "Agus",
      fullName: "Agus Setiawan",
      gender: "MALE" as const,
      birthDate: new Date("2002-02-22"),
      address: "Krajan",
      rt: "001",
      rw: "002",
      phone: "081234567912",
    },
    {
      name: "Rani",
      fullName: "Rani Kusuma",
      gender: "FEMALE" as const,
      birthDate: new Date("2001-05-17"),
      address: "Ngasem",
      rt: "002",
      rw: "001",
      phone: "081234567913",
    },
    {
      name: "Doni",
      fullName: "Doni Firmansyah",
      gender: "MALE" as const,
      birthDate: new Date("2004-07-29"),
      address: "Sidorejo",
      rt: "003",
      rw: "001",
      phone: "081234567914",
    },
    {
      name: "Lia",
      fullName: "Lia Amelia",
      gender: "FEMALE" as const,
      birthDate: new Date("2005-09-19"),
      address: "Krajan",
      rt: "001",
      rw: "001",
      phone: null,
    },
    {
      name: "Irfan",
      fullName: "Irfan Maulana",
      gender: "MALE" as const,
      birthDate: new Date("2000-10-06"),
      address: "Ngasem",
      rt: "002",
      rw: "002",
      phone: "081234567916",
    },
    {
      name: "Indah",
      fullName: "Indah Permata Sari",
      gender: "FEMALE" as const,
      birthDate: new Date("2003-01-14"),
      address: "Krajan",
      rt: "001",
      rw: "002",
      phone: "081234567917",
    },
    {
      name: "Rudi",
      fullName: "Rudi Hartono",
      gender: "MALE" as const,
      birthDate: new Date("2002-02-27"),
      address: "Ngasem",
      rt: "002",
      rw: "001",
      phone: "081234567918",
    },
    {
      name: "Citra",
      fullName: "Citra Kirana",
      gender: "FEMALE" as const,
      birthDate: new Date("2001-03-11"),
      address: "Sidorejo",
      rt: "003",
      rw: "001",
      phone: "081234567919",
    },
    {
      name: "Fikri",
      fullName: "Fikri Ramdani",
      gender: "MALE" as const,
      birthDate: new Date("2004-04-08"),
      address: "Krajan",
      rt: "001",
      rw: "001",
      phone: "081234567920",
    },
    {
      name: "Nadia",
      fullName: "Nadia Safitri",
      gender: "FEMALE" as const,
      birthDate: new Date("2005-05-23"),
      address: "Ngasem",
      rt: "002",
      rw: "002",
      phone: null,
    },
    {
      name: "Tono",
      fullName: "Tono Wijaya",
      gender: "MALE" as const,
      birthDate: new Date("2000-06-19"),
      address: "Sidorejo",
      rt: "003",
      rw: "002",
      phone: "081234567922",
    },
    {
      name: "Salsa",
      fullName: "Salsa Bila",
      gender: "FEMALE" as const,
      birthDate: new Date("2003-07-05"),
      address: "Krajan",
      rt: "001",
      rw: "002",
      phone: "081234567923",
    },
    {
      name: "Bima",
      fullName: "Bima Sakti",
      gender: "MALE" as const,
      birthDate: new Date("2002-08-16"),
      address: "Ngasem",
      rt: "002",
      rw: "001",
      phone: "081234567924",
    },
    {
      name: "Yuli",
      fullName: "Yuli Astuti",
      gender: "FEMALE" as const,
      birthDate: new Date("2001-09-02"),
      address: "Sidorejo",
      rt: "003",
      rw: "001",
      phone: "081234567925",
    },
    {
      name: "Joko",
      fullName: "Joko Susilo",
      gender: "MALE" as const,
      birthDate: new Date("2000-10-28"),
      address: "Krajan",
      rt: "001",
      rw: "001",
      phone: "081234567926",
    },
    {
      name: "Mega",
      fullName: "Mega Utami",
      gender: "FEMALE" as const,
      birthDate: new Date("2004-11-13"),
      address: "Ngasem",
      rt: "002",
      rw: "002",
      phone: null,
    },
    {
      name: "Aldi",
      fullName: "Aldi Firmansyah",
      gender: "MALE" as const,
      birthDate: new Date("2003-12-21"),
      address: "Sidorejo",
      rt: "003",
      rw: "002",
      phone: "081234567928",
    },
    {
      name: "Vina",
      fullName: "Vina Melinda",
      gender: "FEMALE" as const,
      birthDate: new Date("2002-04-30"),
      address: "Krajan",
      rt: "001",
      rw: "002",
      phone: "081234567929",
    },
  ]

  // Hapus data kas & sosial lama dulu (FK ke member/period), lalu member
  await prisma.cashIncome.deleteMany()
  await prisma.cashExpense.deleteMany()
  await prisma.cashPeriod.deleteMany()
  await prisma.sosialIncome.deleteMany()
  await prisma.sosialExpense.deleteMany()
  await prisma.sosialPeriod.deleteMany()
  await prisma.arisanDraw.deleteMany()
  await prisma.arisanIncome.deleteMany()
  await prisma.arisanPeriod.deleteMany()
  await prisma.appSetting.deleteMany()
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

  // Seed Sosial Periods (12 bulan tahun berjalan, iuran seiklasnya min 2000)
  const SOCIAL_MIN = 2000

  await prisma.sosialPeriod.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      year,
      minAmount: SOCIAL_MIN,
      createdById: user.id,
    })),
  })

  const dbSosialPeriods = await prisma.sosialPeriod.findMany({
    where: { year },
    orderBy: { month: "asc" },
  })

  const sosialExpenseTemplates = [
    { description: "Bantuan sosial warga", amount: 15000 },
    { description: "Konsumsi kegiatan", amount: 10000 },
    { description: "Sumbangan acara desa", amount: 20000 },
  ]

  const sosialIncomes: {
    periodId: string
    memberId: string
    amount: number
    paidAt: Date
    note: string | null
    createdById: string
  }[] = []
  const sosialExpenses: {
    periodId: string
    description: string
    amount: number
    spentAt: Date
    createdById: string
  }[] = []

  for (const period of dbSosialPeriods) {
    const contributingCount = 7 + (period.month % 4) // 7-10 member iuran
    for (let i = 0; i < contributingCount; i++) {
      const member = dbMembers[i % dbMembers.length]
      if (!member) continue
      // Iuran seiklasnya: nominal bervariasi di atas batas minimum
      const amount = SOCIAL_MIN * (1 + (i % 3)) // 2000, 4000, 6000
      sosialIncomes.push({
        periodId: period.id,
        memberId: member.id,
        amount,
        paidAt: new Date(year, period.month - 1, 3),
        note: null,
        createdById: user.id,
      })
    }

    const sosialExpenseCount = 1 // satu pengeluaran kecil per bulan
    for (let j = 0; j < sosialExpenseCount; j++) {
      const template =
        sosialExpenseTemplates[(period.month + j) % sosialExpenseTemplates.length]
      sosialExpenses.push({
        periodId: period.id,
        description: template.description,
        amount: template.amount,
        spentAt: new Date(year, period.month - 1, 20 + j * 3),
        createdById: user.id,
      })
    }
  }

  await prisma.sosialIncome.createMany({ data: sosialIncomes })
  await prisma.sosialExpense.createMany({ data: sosialExpenses })

  console.log(`SUCCESS_SOSIAL_SEEDED: ${dbSosialPeriods.length} periods (${year}), ${sosialIncomes.length} incomes, ${sosialExpenses.length} expenses`)

  // Seed Arisan (iuran flat + kocokan bulanan + dana save berjalan)
  const ARISAN_CONTRIBUTION = 5000
  const ARISAN_PAYOUT = 135000

  await prisma.appSetting.upsert({
    where: { key: "arisan.initialSave" },
    update: { value: "200000" },
    create: { key: "arisan.initialSave", value: "200000" },
  })

  await prisma.arisanPeriod.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      year,
      contributionAmount: ARISAN_CONTRIBUTION,
      payoutTarget: ARISAN_PAYOUT,
      createdById: user.id,
    })),
  })

  const dbArisanPeriods = await prisma.arisanPeriod.findMany({
    where: { year },
    orderBy: { month: "asc" },
  })

  const arisanIncomes: {
    periodId: string
    memberId: string
    amount: number
    paidAt: Date
    note: string | null
    createdById: string
  }[] = []
  const arisanDraws: {
    periodId: string
    winnerMemberId: string
    cycleNumber: number
    collectedAmount: number
    payoutAmount: number
    savingsAfter: number
    drawnAt: Date
    createdById: string
  }[] = []

  // Dana save berjalan: mulai dari saldo awal 200000, surplus menumpuk tiap kocokan
  // sehingga dana save selalu ada (tidak pernah nol atau minus)
  let runningSavings = 200000

  for (const period of dbArisanPeriods) {
    // Tidak flat: 28-40 anggota bayar, dan yang bayar berganti tiap bulan
    // (28 x 5000 = 140rb > target 135rb, jadi selalu surplus)
    const payingCount = 28 + ((period.month * 7 + 3) % 13)
    const start = (period.month * 5) % dbMembers.length

    const payingMembers: typeof dbMembers = []
    for (let i = 0; i < payingCount; i++) {
      const member = dbMembers[(start + i) % dbMembers.length]
      if (member) payingMembers.push(member)
    }

    for (const member of payingMembers) {
      arisanIncomes.push({
        periodId: period.id,
        memberId: member.id,
        amount: ARISAN_CONTRIBUTION,
        paidAt: new Date(year, period.month - 1, 1),
        note: null,
        createdById: user.id,
      })
    }

    // Kocokan tiap bulan; pemenang diambil dari yang bayar bulan ini
    const collected = payingMembers.length * ARISAN_CONTRIBUTION
    const winner = payingMembers[(period.month - 1) % payingMembers.length]
    if (!winner) continue

    // Payout selalu target penuh; surplus (collected - payout) masuk dana save
    const payout = ARISAN_PAYOUT
    runningSavings = runningSavings + collected - payout

    arisanDraws.push({
      periodId: period.id,
      winnerMemberId: winner.id,
      cycleNumber: 1,
      collectedAmount: collected,
      payoutAmount: payout,
      savingsAfter: runningSavings,
      drawnAt: new Date(year, period.month - 1, 10),
      createdById: user.id,
    })
  }

  await prisma.arisanIncome.createMany({ data: arisanIncomes })
  await prisma.arisanDraw.createMany({ data: arisanDraws })

  console.log(`SUCCESS_ARISAN_SEEDED: ${dbArisanPeriods.length} periods (${year}), ${arisanIncomes.length} incomes, ${arisanDraws.length} draws`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
