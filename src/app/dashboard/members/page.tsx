"use client"

import { useQuery } from "@tanstack/react-query"
import { membersQuery } from "@features/members/queries"
import { MembersTable } from "@features/members/components/members-table"
import { CreateMemberDialog } from "@features/members/components/create-member-dialog"
import { ExportMembersButton } from "@features/members/components/export-members-button"
import { positionsQuery, memberPositionsMapQuery } from "@/features/positions/queries"

export default function Page() {
  const { data: result, isPending } = useQuery(membersQuery)
  const { data: positionsResult, isPending: positionsPending } = useQuery(positionsQuery)
  const { data: positionsMapResult, isPending: positionsMapPending } = useQuery(
    memberPositionsMapQuery,
  )

  const members = result?.success ? result.data ?? [] : []
  const positions = positionsResult?.success ? positionsResult.data ?? [] : []
  const positionsMap = positionsMapResult?.success ? positionsMapResult.data ?? {} : {}

  if (!result?.success && result?.error) {
    console.error(result.error)
  }

  const loading = isPending || positionsPending || positionsMapPending

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anggota</h1>
          <p className="text-muted-foreground">
            Daftar pemuda pemudi yang terdaftar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMembersButton
            data={members}
            positionsMap={positionsMap}
            disabled={loading}
          />
          <CreateMemberDialog members={members} />
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : (
        <MembersTable data={members} positions={positions} positionsMap={positionsMap} />
      )}
    </div>
  )
}
