"use client"

import type { Member } from "@/generated/prisma/client"
import { DataTable } from "@/components/ui/data-table"
import { memberColumns } from "@features/members/components/member-columns"

interface MembersTableProps {
  data: Member[]
}

export function MembersTable({ data }: MembersTableProps) {
  return <DataTable columns={memberColumns} data={data} />
}
