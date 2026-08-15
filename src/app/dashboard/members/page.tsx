import { getMembers } from "@features/members/actions/get-members"
import { MembersTable } from "@features/members/components/members-table"
import { CreateMemberDialog } from "@features/members/components/create-member-dialog"

export default async function Page() {
  const result = await getMembers()
  const members = result.success ? result.data ?? [] : []

  if (!result.success) {
    console.error(result.error)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anggota</h1>
          <p className="text-muted-foreground">
            Daftar pemuda pemudi yang terdaftar.
          </p>
        </div>
        <CreateMemberDialog />
      </div>
      <MembersTable data={members} />
    </div>
  )
}