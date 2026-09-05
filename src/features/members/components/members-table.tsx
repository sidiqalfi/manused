"use client"

import type { Member, Role } from "@/generated/prisma/client"
import { DataTable } from "@/components/ui/data-table"
import {
  memberColumns,
  memberGlobalFilterFn,
} from "@features/members/components/member-columns"
import type { MemberActiveRolesMap } from "@/features/roles/actions/get-member-active-roles-map"

interface MembersTableProps {
  data: Member[]
  roles: Role[]
  rolesMap: MemberActiveRolesMap
}

export function MembersTable({ data, roles, rolesMap }: MembersTableProps) {
  const dusunOptions = Array.from(new Set(data.map((m) => m.address))).sort()

  return (
    <DataTable
      columns={memberColumns(rolesMap, roles)}
      data={data}
      search={{
        placeholder: "Cari nama atau no. HP…",
        filterFn: memberGlobalFilterFn,
      }}
      filters={[
        {
          columnId: "status",
          label: "Status",
          options: [
            { label: "Aktif", value: "ACTIVE" },
            { label: "Tidak Aktif", value: "INACTIVE" },
          ],
        },
        {
          columnId: "gender",
          label: "Gender",
          options: [
            { label: "Laki-laki", value: "MALE" },
            { label: "Perempuan", value: "FEMALE" },
          ],
        },
        {
          columnId: "address",
          label: "Dusun",
          options: dusunOptions.map((d) => ({ label: d, value: d })),
        },
      ]}
    />
  )
}
