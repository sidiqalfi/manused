"use client"

import { useQuery } from "@tanstack/react-query"
import { membersQuery } from "@features/members/queries"
import { MembersTable } from "@features/members/components/members-table"
import { CreateMemberDialog } from "@features/members/components/create-member-dialog"
import { rolesQuery, memberRolesMapQuery } from "@/features/roles/queries"

export default function Page() {
  const { data: result, isPending } = useQuery(membersQuery)
  const { data: rolesResult, isPending: rolesPending } = useQuery(rolesQuery)
  const { data: rolesMapResult, isPending: rolesMapPending } = useQuery(
    memberRolesMapQuery,
  )

  const members = result?.success ? result.data ?? [] : []
  const roles = rolesResult?.success ? rolesResult.data ?? [] : []
  const rolesMap = rolesMapResult?.success ? rolesMapResult.data ?? {} : {}

  if (!result?.success && result?.error) {
    console.error(result.error)
  }

  const loading = isPending || rolesPending || rolesMapPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anggota</h1>
          <p className="text-muted-foreground">
            Daftar pemuda pemudi yang terdaftar.
          </p>
        </div>
        <CreateMemberDialog members={members} />
      </div>
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : (
        <MembersTable data={members} roles={roles} rolesMap={rolesMap} />
      )}
    </div>
  )
}
