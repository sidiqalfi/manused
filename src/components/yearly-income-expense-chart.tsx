"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MONTHS } from "@/lib/months"
import { formatCurrency } from "@/lib/format"

const chartConfig = {
  totalIncome: {
    label: "Pemasukan",
    color: "var(--chart-2)",
  },
  totalExpense: {
    label: "Pengeluaran",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export type YearlyFlowPoint = {
  month: number
  totalIncome: number
  totalExpense: number
}

type Props = {
  year: number
  data: YearlyFlowPoint[]
  title?: string
}

export function YearlyIncomeExpenseChart({ year, data, title }: Props) {
  if (data.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title ?? `Arus kas tahun ${year}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={data} margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(month: number) => MONTHS[month - 1].slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) =>
                value === 0 ? "0" : `${Math.round(value / 1000)}rb`
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const month = payload?.[0]?.payload?.month as
                      | number
                      | undefined
                    return month != null
                      ? `${MONTHS[month - 1]} ${year}`
                      : String(year)
                  }}
                  formatter={(value) =>
                    formatCurrency(typeof value === "number" ? value : 0)
                  }
                />
              }
            />
            <Bar
              dataKey="totalIncome"
              fill="var(--color-totalIncome)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="totalExpense"
              fill="var(--color-totalExpense)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
