"use client"

import type { Member, Position } from "@/generated/prisma/client"
import { DataTable } from "@/components/ui/data-table"
import {
  memberColumns,
  memberGlobalFilterFn,
} from "@features/members/components/member-columns"
import type { MemberActivePositionsMap } from "@/features/positions/actions/get-member-active-positions-map"

interface MembersTableProps {
  data: Member[]
  positions: Position[]
  positionsMap: MemberActivePositionsMap
}

export function MembersTable({ data, positions, positionsMap }: MembersTableProps) {
  const dusunOptions = Array.from(new Set(data.map((m) => m.address))).sort()

  return (
    <DataTable
      columns={memberColumns(positionsMap, positions, data)}
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
