"use client"

import type { ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  YearlyIncomeExpenseChart,
  type YearlyFlowPoint,
} from "@/components/yearly-income-expense-chart"

type Props = {
  title: string
  href: string
  periodLabel: string | null
  chart: {
    year: number
    data: YearlyFlowPoint[]
    title: string
  } | null
  emptyText: string
  createPeriodTrigger: ReactNode
}

export function BookSectionCard({
  title,
  href,
  periodLabel,
  chart,
  emptyText,
  createPeriodTrigger,
}: Props) {
  const hasPeriod = periodLabel != null && chart != null

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {hasPeriod ? periodLabel : "Belum ada periode"}
          </CardDescription>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            render={<a href={href} />}
          >
            Lihat lengkap
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {hasPeriod ? (
          <YearlyIncomeExpenseChart
            year={chart.year}
            data={chart.data}
            title={chart.title}
            type="line"
          />
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-muted/50 p-6 ring-1 ring-foreground/5">
            <p className="text-sm text-muted-foreground">{emptyText}</p>
            {createPeriodTrigger}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
