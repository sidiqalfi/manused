import { ActivityLogTable } from "@/features/log/components/activity-log-table"

export default function Page() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log</h1>
        <p className="text-muted-foreground">
          Riwayat aktivitas semua pengurus. Tidak dapat dihapus.
        </p>
      </div>
      <ActivityLogTable />
    </div>
  )
}
