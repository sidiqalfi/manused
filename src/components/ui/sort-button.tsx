"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc"

type Align = "left" | "center" | "right"

type SortButtonProps = {
  children: React.ReactNode
  active: boolean
  direction: SortDirection
  align?: Align
  onClick: () => void
}

/**
 * Header tombol untuk kolom tabel yang bisa di-sort.
 * Ikon panah berganti sesuai arah sort, tampil muted saat kolom belum aktif.
 */
export function SortButton({
  children,
  active,
  direction,
  align = "left",
  onClick,
}: SortButtonProps) {
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex w-full items-center gap-1.5 font-medium transition-colors hover:text-primary",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
        align === "left" && "justify-start",
        active ? "text-foreground" : "text-muted-foreground"
      )}
      aria-label={`Urutkan berdasarkan ${
        typeof children === "string" ? children : "kolom"
      }`}
    >
      {children}
      <Icon className={cn("h-3.5 w-3.5", !active && "opacity-50")} />
    </button>
  )
}
