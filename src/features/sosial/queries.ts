import { queryOptions } from "@tanstack/react-query"
import { getSosialPeriod, getSosialPeriods } from "./actions/get-sosial-periods"
import { getSosialSummary } from "./actions/get-sosial-summary"
import { getSosialYearSummary } from "./actions/get-sosial-year-summary"
import { getSosialYearChart } from "./actions/get-sosial-year-chart"

export const sosialKeys = {
  all: ["sosial"] as const,
  periods: () => [...sosialKeys.all, "periods"] as const,
  period: (id: string) => [...sosialKeys.all, "periods", id] as const,
  summary: (id: string) => [...sosialKeys.all, "periods", id, "summary"] as const,
  yearSummary: (year: number) => [...sosialKeys.all, "year", year, "summary"] as const,
  yearChart: (year: number) => [...sosialKeys.all, "year", year, "chart"] as const,
}

export const sosialPeriodsQuery = queryOptions({
  queryKey: sosialKeys.periods(),
  queryFn: getSosialPeriods,
})

export function sosialPeriodQuery(periodId: string) {
  return queryOptions({
    queryKey: sosialKeys.period(periodId),
    queryFn: () => getSosialPeriod(periodId),
    enabled: Boolean(periodId),
  })
}

export function sosialSummaryQuery(periodId: string) {
  return queryOptions({
    queryKey: sosialKeys.summary(periodId),
    queryFn: () => getSosialSummary(periodId),
    enabled: Boolean(periodId),
  })
}

export function sosialYearSummaryQuery(year: number | null) {
  return queryOptions({
    queryKey: sosialKeys.yearSummary(year ?? 0),
    queryFn: () => getSosialYearSummary(year as number),
    enabled: year !== null,
  })
}

export function sosialYearChartQuery(year: number | null) {
  return queryOptions({
    queryKey: sosialKeys.yearChart(year ?? 0),
    queryFn: () => getSosialYearChart(year as number),
    enabled: year !== null,
  })
}
