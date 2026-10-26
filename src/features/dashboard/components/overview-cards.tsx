"use client"

import { Wallet, HandCoins, Users, Shuffle } from "lucide-react"
import { SummaryStatCards, type SummaryStat } from "@/components/summary-stat-cards"
import { formatCurrency } from "@/lib/format"

type Props = {
  cashBalance: number | null
  cashCaption: string | null
  sosialBalance: number | null
  sosialCaption: string | null
  arisanSavings: number | null
  arisanCaption: string | null
  activeMembers: number | null
  totalMembers: number | null
}

function money(value: number | null) {
  return value == null ? "-" : formatCurrency(value)
}

export function OverviewCards({
  cashBalance,
  cashCaption,
  sosialBalance,
  sosialCaption,
  arisanSavings,
  arisanCaption,
  activeMembers,
  totalMembers,
}: Props) {
  const stats: SummaryStat[] = [
    {
      label: "Saldo Kas",
      value: money(cashBalance),
      caption: cashCaption ?? "Belum ada data kas",
      icon: Wallet,
    },
    {
      label: "Saldo Sosial",
      value: money(sosialBalance),
      caption: sosialCaption ?? "Belum ada data sosial",
      icon: HandCoins,
    },
    {
      label: "Dana Save Arisan",
      value: money(arisanSavings),
      caption: arisanCaption ?? "Belum ada data arisan",
      icon: Shuffle,
      valueClassName: "text-primary",
    },
    {
      label: "Anggota",
      value: activeMembers == null ? "-" : `${activeMembers} aktif`,
      caption: totalMembers == null ? null : `dari ${totalMembers} anggota`,
      icon: Users,
    },
  ]

  return <SummaryStatCards stats={stats} columns={4} />
}
