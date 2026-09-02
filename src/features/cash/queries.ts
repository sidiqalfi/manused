import { queryOptions } from "@tanstack/react-query"
import { getCashPeriod, getCashPeriods } from "./actions/get-cash-periods"
import { getCashSummary } from "./actions/get-cash-summary"
import { getCashYearSummary } from "./actions/get-cash-year-summary"
import { getCashYearChart } from "./actions/get-cash-year-chart"
import { getCashInitialBalance } from "./actions/get-initial-balance"

export const cashKeys = {
  all: ["cash"] as const,
  periods: () => [...cashKeys.all, "periods"] as const,
  period: (id: string) => [...cashKeys.all, "periods", id] as const,
  summary: (id: string) => [...cashKeys.all, "periods", id, "summary"] as const,
  yearSummary: (year: number) => [...cashKeys.all, "year", year, "summary"] as const,
  yearChart: (year: number) => [...cashKeys.all, "year", year, "chart"] as const,
  initialBalance: () => [...cashKeys.all, "initialBalance"] as const,
}

export const cashInitialBalanceQuery = queryOptions({
  queryKey: cashKeys.initialBalance(),
  queryFn: getCashInitialBalance,
})

export const cashPeriodsQuery = queryOptions({
  queryKey: cashKeys.periods(),
  queryFn: getCashPeriods,
})

export function cashPeriodQuery(periodId: string) {
  return queryOptions({
    queryKey: cashKeys.period(periodId),
    queryFn: () => getCashPeriod(periodId),
    enabled: Boolean(periodId),
  })
}

export function cashSummaryQuery(periodId: string) {
  return queryOptions({
    queryKey: cashKeys.summary(periodId),
    queryFn: () => getCashSummary(periodId),
    enabled: Boolean(periodId),
  })
}

export function cashYearSummaryQuery(year: number | null) {
  return queryOptions({
    queryKey: cashKeys.yearSummary(year ?? 0),
    queryFn: () => getCashYearSummary(year as number),
    enabled: year !== null,
  })
}

export function cashYearChartQuery(year: number | null) {
  return queryOptions({
    queryKey: cashKeys.yearChart(year ?? 0),
    queryFn: () => getCashYearChart(year as number),
    enabled: year !== null,
  })
}
