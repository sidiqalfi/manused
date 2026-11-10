"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { usersQuery } from "../queries"
import type { ManagedUser } from "../user-select"
import { USER_ACCESS_LABELS } from "../user-schemas"
import { UserFormDialog } from "./user-form-dialog"
import { ResetPasswordDialog } from "./reset-password-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"

export function UsersView({ currentUserId }: { currentUserId: string }) {
  const query = useQuery(usersQuery)
  const [message, setMessage] = useState("")
  const columns: ColumnDef<ManagedUser>[] = [
    { accessorKey: "name", header: "Nama", cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.name ?? "—"}</span>
        {row.original.id === currentUserId ? <Badge variant="outline">Anda</Badge> : null}
      </div>
    ) },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Hak akses", cell: ({ row }) => USER_ACCESS_LABELS[row.original.role] },
    { id: "status", accessorFn: (user) => String(user.isActive), header: "Status", cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "outline"}>{row.original.isActive ? "Aktif" : "Nonaktif"}</Badge>
    ) },
    { accessorKey: "createdAt", header: "Terdaftar", cell: ({ row }) => formatDate(new Date(row.original.createdAt)), enableGlobalFilter: false },
    { id: "actions", header: "Tindakan", cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <UserFormDialog user={row.original} isCurrentUser={row.original.id === currentUserId} onSaved={setMessage} />
        <ResetPasswordDialog user={row.original} onSaved={setMessage} />
        {row.original.id !== currentUserId ? <DeleteUserDialog user={row.original} onSaved={setMessage} /> : null}
      </div>
    ) },
  ]
  const error = query.error ? "Gagal memuat pengguna. Periksa koneksi lalu coba lagi." : query.data?.error

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Pengguna</h1>
          <p className="mt-1 text-muted-foreground">Atur akun, hak akses, dan status pengurus yang menggunakan Manused.</p>
        </div>
        <UserFormDialog onSaved={setMessage} />
      </div>
      {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
      {query.isPending ? (
        <div className="space-y-3" role="status" aria-label="Memuat pengguna">
          <Skeleton className="h-9 w-full sm:w-72" />
          <Skeleton className="h-52 w-full" />
          <span className="sr-only">Memuat pengguna…</span>
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-xl border p-6">
          <p role="alert" className="text-sm text-destructive">{error}</p>
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Coba Lagi</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={query.data?.data ?? []}
          search={{ placeholder: "Cari nama atau email…", filterFn: (row, _columnId, value) => {
            const search = String(value).toLocaleLowerCase("id-ID").trim()
            return `${row.original.name ?? ""} ${row.original.email}`.toLocaleLowerCase("id-ID").includes(search)
          } }}
          filters={[
            { columnId: "role", label: "Hak akses", options: [{ value: "ADMIN", label: "Administrator" }, { value: "USER", label: "Pengguna" }] },
            { columnId: "status", label: "Status", options: [{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }] },
          ]}
          emptyMessage="Belum ada pengguna terdaftar. Tambahkan pengguna untuk mulai mencatat bersama."
        />
      )}
      <p className="text-sm text-muted-foreground">Minimal satu administrator aktif harus tetap tersedia. Hak akses akun dikelola terpisah dari jabatan organisasi anggota.</p>
    </div>
  )
}
