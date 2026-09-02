"use client"

import type { Member, Role } from "@/generated/prisma/client"
import { DataTable } from "@/components/ui/data-table"
import { memberColumns } from "@features/members/components/member-columns"
import type { MemberActiveRolesMap } from "@/features/roles/actions/get-member-active-roles-map"

interface MembersTableProps {
  data: Member[]
  roles: Role[]
  rolesMap: MemberActiveRolesMap
}

export function MembersTable({ data, roles, rolesMap }: MembersTableProps) {
  return <DataTable columns={memberColumns(rolesMap, roles)} data={data} />
}
