import { queryOptions } from "@tanstack/react-query"
import { getCashPeriods } from "./actions/get-cash-periods"

export const cashKeys = {
  all: ["cash"] as const,
  periods: () => [...cashKeys.all, "periods"] as const,
}

export const cashPeriodsQuery = queryOptions({
  queryKey: cashKeys.periods(),
  queryFn: getCashPeriods,
})
