import { queryOptions } from "@tanstack/react-query"
import { getArisanPeriod, getArisanPeriods } from "./actions/get-arisan-periods"
import { getArisanSummary } from "./actions/get-arisan-summary"
import { getArisanDraws } from "./actions/get-arisan-draws"
import { getArisanOverview } from "./actions/get-arisan-overview"
import { getArisanYearChart } from "./actions/get-arisan-year-chart"
import { getArisanYearSummary } from "./actions/get-arisan-year-summary"
import { getInitialSave } from "./actions/get-initial-save"

export const arisanKeys = {
  all: ["arisan"] as const,
  periods: () => [...arisanKeys.all, "periods"] as const,
  period: (id: string) => [...arisanKeys.all, "periods", id] as const,
  summary: (id: string) => [...arisanKeys.all, "periods", id, "summary"] as const,
  draws: (id: string) => [...arisanKeys.all, "periods", id, "draws"] as const,
  yearSummary: (year: number) => [...arisanKeys.all, "year", year, "summary"] as const,
  yearChart: (year: number) => [...arisanKeys.all, "year", year, "chart"] as const,
  overview: () => [...arisanKeys.all, "overview"] as const,
  initialSave: () => [...arisanKeys.all, "initialSave"] as const,
}

export const arisanPeriodsQuery = queryOptions({
  queryKey: arisanKeys.periods(),
  queryFn: getArisanPeriods,
})

export function arisanPeriodQuery(periodId: string) {
  return queryOptions({
    queryKey: arisanKeys.period(periodId),
    queryFn: () => getArisanPeriod(periodId),
    enabled: Boolean(periodId),
  })
}

export function arisanSummaryQuery(periodId: string) {
  return queryOptions({
    queryKey: arisanKeys.summary(periodId),
    queryFn: () => getArisanSummary(periodId),
    enabled: Boolean(periodId),
  })
}

export function arisanDrawsQuery(periodId: string) {
  return queryOptions({
    queryKey: arisanKeys.draws(periodId),
    queryFn: () => getArisanDraws(periodId),
    enabled: Boolean(periodId),
  })
}

export function arisanYearSummaryQuery(year: number | null) {
  return queryOptions({
    queryKey: arisanKeys.yearSummary(year ?? 0),
    queryFn: () => getArisanYearSummary(year as number),
    enabled: year !== null,
  })
}

export function arisanYearChartQuery(year: number | null) {
  return queryOptions({
    queryKey: arisanKeys.yearChart(year ?? 0),
    queryFn: () => getArisanYearChart(year as number),
    enabled: year !== null,
  })
}

export const arisanOverviewQuery = queryOptions({
  queryKey: arisanKeys.overview(),
  queryFn: getArisanOverview,
})

export const initialSaveQuery = queryOptions({
  queryKey: arisanKeys.initialSave(),
  queryFn: getInitialSave,
})
