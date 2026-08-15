import { queryOptions } from "@tanstack/react-query"
import { getCashPeriod, getCashPeriods } from "./actions/get-cash-periods"
import { getCashSummary } from "./actions/get-cash-summary"

export const cashKeys = {
  all: ["cash"] as const,
  periods: () => [...cashKeys.all, "periods"] as const,
  period: (id: string) => [...cashKeys.all, "periods", id] as const,
  summary: (id: string) => [...cashKeys.all, "periods", id, "summary"] as const,
}

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
