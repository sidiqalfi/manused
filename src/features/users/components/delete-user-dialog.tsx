"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { deleteUser } from "../actions/delete-user"
import { useUserMutation } from "../hooks/use-user-mutation"
import type { ManagedUser } from "../user-select"

export function DeleteUserDialog({ user, onSaved }: { user: ManagedUser; onSaved: (message: string) => void }) {
  const [open, setOpen] = useState(false)
  const { error, setError, pending, submit } = useUserMutation(() => {
    setOpen(false)
    onSaved(`Akun ${user.name ?? user.email} berhasil dihapus.`)
  })

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!pending) { setError(null); setOpen(next) } }}>
      <AlertDialogTrigger render={<Button size="sm" variant="ghost" className="min-h-9 text-destructive" aria-label={`Hapus akun ${user.email}`} />}>Hapus</AlertDialogTrigger>
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus akun pengguna?</AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            Akun {user.name ? `${user.name} (${user.email})` : user.email} akan dihapus permanen dan semua sesinya akan berakhir. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">Akun yang masih tercatat sebagai pembuat data anggota atau transaksi tidak dapat dihapus. Nonaktifkan akun melalui tombol Ubah untuk menghentikan aksesnya.</p>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" className="text-[color-mix(in_oklch,var(--destructive),var(--foreground)_15%)] dark:text-destructive" disabled={pending} onClick={() => {
            const data = new FormData()
            data.set("id", user.id)
            submit(deleteUser, data)
          }}>{pending ? "Menghapus…" : "Hapus akun"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
