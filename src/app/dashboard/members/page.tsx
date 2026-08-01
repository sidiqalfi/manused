import { getMembers } from "@features/members/actions/get-members"
import { MembersTable } from "@features/members/components/members-table"

export default async function Page() {
  const members = await getMembers()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anggota</h1>
          <p className="text-muted-foreground">
            Daftar pemuda pemudi yang terdaftar.
          </p>
        </div>
      </div>
      <MembersTable data={members} />
    </div>
  )
}