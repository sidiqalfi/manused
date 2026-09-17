import { queryOptions } from "@tanstack/react-query"
import { getDashboardData } from "./actions/get-dashboard-data"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  data: () => [...dashboardKeys.all, "data"] as const,
}

export const dashboardDataQuery = queryOptions({
  queryKey: dashboardKeys.data(),
  queryFn: getDashboardData,
  // The dashboard bundle covers every section of the page in one round-trip;
  // keep it fresh for 5 minutes so navigation back to the dashboard is instant.
  staleTime: 5 * 60 * 1000,
})
