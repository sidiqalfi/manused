"use client"

import type { ColumnDef, Row } from "@tanstack/react-table"
import type { Member, Role } from "@/generated/prisma/client"
import { Badge } from "@/components/ui/badge"
import { DeleteMemberDialog } from "@features/members/components/delete-member-dialog"
import { EditMemberDialog } from "@features/members/components/edit-member-dialog"
import type { MemberActiveRolesMap } from "@/features/roles/actions/get-member-active-roles-map"

export function memberGlobalFilterFn(
  row: Row<Member>,
  _columnId: string,
  filterValue: unknown,
): boolean {
  const query = String(filterValue ?? "").trim().toLowerCase()
  if (!query) return true

  const { name, fullName, phone } = row.original
  return [name, fullName, phone ?? ""].some((field) =>
    field.toLowerCase().includes(query),
  )
}

export function memberColumns(
  rolesMap: MemberActiveRolesMap,
  allRoles: Role[],
): ColumnDef<Member>[] {
  return [
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
      filterFn: "equals",
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
      filterFn: "equals",
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
      filterFn: "equals",
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
      id: "roles",
      header: "Role",
      cell: ({ row }) => {
        const member = row.original
        const roles = rolesMap[member.id] ?? []
        if (roles.length === 0) {
          return <span className="text-muted-foreground">-</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <Badge
                key={r.id}
                variant={r.rank <= 5 ? "default" : "outline"}
              >
                {r.name}
              </Badge>
            ))}
          </div>
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
        const currentRoleIds = (rolesMap[member.id] ?? []).map((r) => r.id)
        return (
          <div className="flex justify-end gap-1">
            <EditMemberDialog
              member={member}
              allRoles={allRoles}
              currentRoleIds={currentRoleIds}
            />
            <DeleteMemberDialog id={member.id} name={member.name} />
          </div>
        )
      },
    },
  ]
}
