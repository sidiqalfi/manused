"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DownloadIcon, FileJsonIcon, FileSpreadsheetIcon } from "lucide-react"
import type { Member } from "@/generated/prisma/client"
import type { MemberActiveRolesMap } from "@/features/roles/actions/get-member-active-roles-map"
import {
  download,
  formatDate,
  pickColumns,
  toCsv,
  todayStamp,
} from "@/lib/export-utils"

interface ExportMembersButtonProps {
  data: Member[]
  rolesMap: MemberActiveRolesMap
  disabled?: boolean
}

const GENDER_LABEL: Record<string, string> = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Tidak Aktif",
}

function roleNames(memberId: string, rolesMap: MemberActiveRolesMap): string {
  return (rolesMap[memberId] ?? []).map((role) => role.name).join(", ")
}

type ColumnKey =
  | "Nama"
  | "Nama Lengkap"
  | "Gender"
  | "Tanggal Lahir"
  | "Dusun"
  | "RT"
  | "RW"
  | "No. HP"
  | "Status"
  | "Jabatan"
  | "Tanggal Bergabung"

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "Nama", label: "Nama panggilan" },
  { key: "Nama Lengkap", label: "Nama lengkap" },
  { key: "Gender", label: "Jenis kelamin" },
  { key: "Tanggal Lahir", label: "Tanggal lahir" },
  { key: "Dusun", label: "Alamat/dusun" },
  { key: "RT", label: "RT" },
  { key: "RW", label: "RW" },
  { key: "No. HP", label: "No. HP" },
  { key: "Status", label: "Status keanggotaan" },
  { key: "Jabatan", label: "Jabatan" },
  { key: "Tanggal Bergabung", label: "Tanggal bergabung" },
]

function toRows(
  data: Member[],
  rolesMap: MemberActiveRolesMap
): Record<string, string | number>[] {
  return data.map((member) => ({
    Nama: member.name,
    "Nama Lengkap": member.fullName,
    Gender: GENDER_LABEL[member.gender] ?? member.gender,
    "Tanggal Lahir": formatDate(member.birthDate),
    Dusun: member.address,
    RT: member.rt,
    RW: member.rw,
    "No. HP": member.phone ?? "",
    Status: STATUS_LABEL[member.status] ?? member.status,
    Jabatan: roleNames(member.id, rolesMap),
    "Tanggal Bergabung": formatDate(member.joinDate),
  }))
}

export function ExportMembersButton({
  data,
  rolesMap,
  disabled,
}: ExportMembersButtonProps) {
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  // Kolom terpilih dibawa antar pembukaan dialog — default semua.
  const [selected, setSelected] = useState<Set<ColumnKey>>(
    () => new Set(ALL_COLUMNS.map((c) => c.key))
  )
  const base = `anggota-manused-${todayStamp()}`

  function toggle(key: ColumnKey) {
    setSelected((prev) => {
      // Minimal satu kolom harus tetap terpilih.
      if (prev.has(key) && prev.size === 1) return prev
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(ALL_COLUMNS.map((c) => c.key)))
  }

  function handleExportCsv() {
    const rows = pickColumns(toRows(data, rolesMap), [...selected])
    download(toCsv(rows), `${base}.csv`, "text/csv;charset=utf-8")
    setColumnDialogOpen(false)
  }

  function handleExportJson() {
    const rows = pickColumns(toRows(data, rolesMap), [...selected])
    download(
      JSON.stringify(rows, null, 2),
      `${base}.json`,
      "application/json;charset=utf-8"
    )
    setColumnDialogOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" disabled={disabled || data.length === 0}>
              <DownloadIcon />
              Export
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setColumnDialogOpen(true)}>
            <DownloadIcon className="text-muted-foreground" />
            <span>Pilih Kolom…</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportCsv}>
            <FileSpreadsheetIcon className="text-muted-foreground" />
            <span>Export CSV (semua)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportJson}>
            <FileJsonIcon className="text-muted-foreground" />
            <span>Export JSON (semua)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Kolom Export</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selected.size} dari {ALL_COLUMNS.length} kolom dipilih
              </p>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Pilih Semua
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(col.key)}
                    onChange={() => toggle(col.key)}
                    className="h-4 w-4"
                  />
                  {col.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setColumnDialogOpen(false)}
              >
                Batal
              </Button>
              <Button variant="outline" onClick={handleExportJson}>
                <FileJsonIcon className="text-muted-foreground" />
                JSON
              </Button>
              <Button onClick={handleExportCsv}>
                <FileSpreadsheetIcon />
                CSV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
