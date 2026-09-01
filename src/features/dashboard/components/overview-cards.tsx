"use client"

import { Wallet, HandCoins, Users, Shuffle, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

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

function OverviewItem({
  label,
  value,
  caption,
  icon: Icon,
  valueClassName,
}: {
  label: string
  value: string
  caption?: string | null
  icon: LucideIcon
  valueClassName?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tabular-nums", valueClassName)}>
          {value}
        </div>
        {caption ? (
          <p className="text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </CardContent>
    </Card>
  )
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
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OverviewItem
        label="Saldo Kas"
        value={money(cashBalance)}
        caption={cashCaption ?? "Belum ada data kas"}
        icon={Wallet}
      />
      <OverviewItem
        label="Saldo Sosial"
        value={money(sosialBalance)}
        caption={sosialCaption ?? "Belum ada data sosial"}
        icon={HandCoins}
      />
      <OverviewItem
        label="Anggota"
        value={activeMembers == null ? "-" : `${activeMembers} aktif`}
        caption={totalMembers == null ? null : `dari ${totalMembers} anggota`}
        icon={Users}
      />
      <OverviewItem
        label="Dana Save Arisan"
        value={money(arisanSavings)}
        caption={arisanCaption ?? "Belum ada data arisan"}
        icon={Shuffle}
        valueClassName="text-primary"
      />
    </div>
  )
}
