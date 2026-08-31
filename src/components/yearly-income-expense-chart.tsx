"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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
  type?: "bar" | "line"
}

export function YearlyIncomeExpenseChart({ year, data, title, type = "bar" }: Props) {
  if (data.length === 0) {
    return null
  }

  const axes = (
    <>
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
    </>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title ?? `Arus kas tahun ${year}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          {type === "line" ? (
            <LineChart data={data} margin={{ left: 4, right: 4 }}>
              {axes}
              <Line
                dataKey="totalIncome"
                type="monotone"
                stroke="var(--color-totalIncome)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                dataKey="totalExpense"
                type="monotone"
                stroke="var(--color-totalExpense)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ left: 4, right: 4 }}>
              {axes}
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
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
