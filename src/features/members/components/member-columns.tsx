"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Member } from "@/generated/prisma/client"
import { Badge } from "@/components/ui/badge"
import { DeleteMemberDialog } from "@features/members/components/delete-member-dialog"
import { EditMemberDialog } from "@features/members/components/edit-member-dialog"

export const memberColumns: ColumnDef<Member>[] = [
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "fullName",
    header: "Nama Lengkap",
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => {
      const gender = row.getValue("gender") as string
      return (
        <Badge variant={gender === "MALE" ? "default" : "secondary"}>
          {gender === "MALE" ? "Laki-laki" : "Perempuan"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "birthDate",
    header: "Tanggal Lahir",
    cell: ({ row }) => {
      const date = row.getValue("birthDate") as Date
      return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    },
  },
  {
    accessorKey: "address",
    header: "Dusun",
  },
  {
    accessorKey: "rt",
    header: "RT",
  },
  {
    accessorKey: "rw",
    header: "RW",
  },
  {
    accessorKey: "phone",
    header: "No. HP",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | null
      return phone ?? <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "ACTIVE" ? "default" : "outline"}>
          {status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "joinDate",
    header: "Bergabung",
    cell: ({ row }) => {
      const date = row.getValue("joinDate") as Date
      return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Aksi</span>,
    cell: ({ row }) => {
      const member = row.original
      return (
        <div className="flex justify-end gap-1">
          <EditMemberDialog member={member} />
          <DeleteMemberDialog id={member.id} name={member.name} />
        </div>
      )
    },
  },
]
