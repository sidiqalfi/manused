"use client"

import type { Member } from "@/generated/prisma/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DownloadIcon, FileJsonIcon, FileSpreadsheetIcon } from "lucide-react"
import type { MemberActiveRolesMap } from "@/features/roles/actions/get-member-active-roles-map"

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

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ""
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function roleNames(memberId: string, rolesMap: MemberActiveRolesMap): string {
  return (rolesMap[memberId] ?? []).map((role) => role.name).join(", ")
}

function toRows(data: Member[], rolesMap: MemberActiveRolesMap) {
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

function escapeCsv(value: unknown): string {
  const text = String(value ?? "")
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return ""

  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
  ]

  // BOM supaya Excel membaca UTF-8 dengan benar
  return "﻿" + lines.join("\r\n")
}

function todayStamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function download(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function ExportMembersButton({
  data,
  rolesMap,
  disabled,
}: ExportMembersButtonProps) {
  const handleExportCsv = () => {
    const csv = toCsv(toRows(data, rolesMap))
    download(csv, `anggota-manused-${todayStamp()}.csv`, "text/csv;charset=utf-8")
  }

  const handleExportJson = () => {
    const json = JSON.stringify(toRows(data, rolesMap), null, 2)
    download(
      json,
      `anggota-manused-${todayStamp()}.json`,
      "application/json;charset=utf-8"
    )
  }

  return (
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
        <DropdownMenuItem onClick={handleExportCsv}>
          <FileSpreadsheetIcon className="text-muted-foreground" />
          <span>Export CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJson}>
          <FileJsonIcon className="text-muted-foreground" />
          <span>Export JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
