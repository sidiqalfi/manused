"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface DataTableFilterOption {
  label: string
  value: string
}

export interface DataTableFilter {
  columnId: string
  label: string
  options: DataTableFilterOption[]
}

export interface DataTableSearch<TData> {
  placeholder?: string
  filterFn?: (row: Row<TData>, columnId: string, filterValue: unknown) => boolean
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  pageSizeOptions?: number[]
  search?: DataTableSearch<TData>
  filters?: DataTableFilter[]
  emptyMessage?: string
  filteredEmptyMessage?: string
}

const ALL_VALUE = "all"

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 50, 100],
  search,
  filters,
  emptyMessage = "Tidak ada data.",
  filteredEmptyMessage = "Tidak ada data yang cocok dengan pencarian atau filter.",
}: DataTableProps<TData, TValue>) {
  "use no memo"

  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    state: { globalFilter, columnFilters },
    globalFilterFn: search?.filterFn,
    initialState: {
      pagination: { pageSize },
    },
  })

  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const hasActiveFilter =
    columnFilters.length > 0 || globalFilter.trim() !== ""
  const hasData = data.length > 0

  function filterValueLabel(filter: DataTableFilter): string | null {
    const value = table.getColumn(filter.columnId)?.getFilterValue() as
      | string
      | undefined
    if (!value || value === ALL_VALUE) return null
    return filter.options.find((o) => o.value === value)?.label ?? value
  }

  return (
    <div className="space-y-3">
      {hasData && (search || filters?.length) ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {search ? (
            <div className="relative w-full lg:w-90">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={search.placeholder ?? "Cari…"}
                aria-label="Cari"
                className="pl-9"
              />
            </div>
          ) : null}

          {filters?.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((filter) => {
                const column = table.getColumn(filter.columnId)
                if (!column) return null
                const value =
                  (column.getFilterValue() as string | undefined) ?? ALL_VALUE
                return (
                  <Select
                    key={filter.columnId}
                    value={value}
                    onValueChange={(next) =>
                      column.setFilterValue(
                        next === ALL_VALUE ? undefined : next,
                      )
                    }
                  >
                    <SelectTrigger size="sm" className="gap-2">
                      <span className="text-muted-foreground">
                        {filter.label}
                      </span>
                      <SelectValue
                        placeholder={filter.options[0]?.label ?? "Semua"}
                      />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start">
                      <SelectItem value={ALL_VALUE}>Semua</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasActiveFilter ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter aktif:</span>
          {globalFilter.trim() ? (
            <Badge variant="secondary">
              Cari: {globalFilter.trim()}
            </Badge>
          ) : null}
          {(filters ?? [])
            .map(filterValueLabel)
            .filter((label): label is string => label !== null)
            .map((label) => (
              <Badge key={label} variant="secondary">
                {label}
              </Badge>
            ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              table.resetColumnFilters()
              setGlobalFilter("")
            }}
          >
            <XIcon data-icon="inline-start" />
            Reset
          </Button>
        </div>
      ) : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-12 text-center">No</TableHead>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  <TableCell className="text-center text-muted-foreground">
                    {pageIndex * currentPageSize + index + 1}
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  {hasData ? filteredEmptyMessage : emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col-reverse items-center justify-between gap-3 px-1 sm:flex-row">
        <div className="text-sm text-muted-foreground">
          Menampilkan {table.getRowModel().rows.length} dari{" "}
          {table.getRowCount()} data.
        </div>
        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:gap-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Baris per halaman</p>
            <Select
              value={`${currentPageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-18">
                <SelectValue placeholder={currentPageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">
              Halaman {pageCount === 0 ? 0 : pageIndex + 1} dari {pageCount}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="Halaman pertama"
              >
                <ChevronsLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Halaman berikutnya"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Halaman terakhir"
              >
                <ChevronsRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
