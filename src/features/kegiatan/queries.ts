import { queryOptions } from "@tanstack/react-query"
import { getKegiatanList } from "./actions/get-kegiatan-list"
import { getKegiatanDetail } from "./actions/get-kegiatan-detail"
import { getKegiatanYearSummary } from "./actions/get-kegiatan-year-summary"
import { getKegiatanYearChart } from "./actions/get-kegiatan-year-chart"

export const kegiatanKeys = {
  all: ["kegiatan"] as const,
  list: () => [...kegiatanKeys.all, "list"] as const,
  detail: (id: string) => [...kegiatanKeys.all, "detail", id] as const,
  yearSummary: (year: number) => [...kegiatanKeys.all, "year", year, "summary"] as const,
  yearChart: (year: number) => [...kegiatanKeys.all, "year", year, "chart"] as const,
  yearPaymentMatrix: (year: number) =>
    [...kegiatanKeys.all, "year", year, "payment-matrix"] as const,
}

export const kegiatanListQuery = queryOptions({
  queryKey: kegiatanKeys.list(),
  queryFn: getKegiatanList,
})

export function kegiatanDetailQuery(kegiatanId: string) {
  return queryOptions({
    queryKey: kegiatanKeys.detail(kegiatanId),
    queryFn: () => getKegiatanDetail(kegiatanId),
    enabled: Boolean(kegiatanId),
  })
}

export function kegiatanYearSummaryQuery(year: number | null) {
  return queryOptions({
    queryKey: kegiatanKeys.yearSummary(year ?? 0),
    queryFn: () => getKegiatanYearSummary(year as number),
    enabled: year !== null,
  })
}

export function kegiatanYearChartQuery(year: number | null) {
  return queryOptions({
    queryKey: kegiatanKeys.yearChart(year ?? 0),
    queryFn: () => getKegiatanYearChart(year as number),
    enabled: year !== null,
  })
}
