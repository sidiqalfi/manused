"use client"

import { useId, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createUser } from "../actions/create-user"
import { updateUser } from "../actions/update-user"
import { useUserMutation } from "../hooks/use-user-mutation"
import type { ManagedUser } from "../user-select"

const selectClassName = "h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function UserFormDialog({ user, isCurrentUser = false, onSaved }: {
  user?: ManagedUser
  isCurrentUser?: boolean
  onSaved: (message: string) => void
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const { error, setError, pending, submit } = useUserMutation(() => {
    setOpen(false)
    onSaved(user ? "Perubahan pengguna tersimpan." : "Pengguna berhasil ditambahkan.")
  })

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) { setError(null); setOpen(next) } }}>
      <DialogTrigger render={<Button variant={user ? "outline" : "default"} size={user ? "sm" : "default"} aria-label={user ? `Ubah pengguna ${user.name ?? user.email}` : undefined} />}>
        {user ? "Ubah" : <><Plus aria-hidden="true" />Tambah Pengguna</>}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Ubah Pengguna" : "Tambah Pengguna"}</DialogTitle>
          <DialogDescription>{user ? "Perbarui identitas, hak akses, atau status akun." : "Buat akun pengurus dengan email dan password untuk login."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => {
          event.preventDefault()
          submit(user ? updateUser : createUser, new FormData(event.currentTarget))
        }} className="space-y-5">
          {user ? <input type="hidden" name="id" value={user.id} /> : null}
          <fieldset disabled={pending} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-name`}>Nama</Label>
              <Input id={`${id}-name`} name="name" defaultValue={user?.name ?? ""} required maxLength={100} autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input id={`${id}-email`} name="email" type="email" defaultValue={user?.email ?? ""} required maxLength={254} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-role`}>Hak akses</Label>
              <select id={`${id}-role`} name="role" defaultValue={user?.role ?? "USER"} className={selectClassName}>
                <option value="USER">Pengguna</option>
                <option value="ADMIN">Administrator</option>
              </select>
              <p className="text-sm text-muted-foreground">Administrator dapat menambah dan mengelola akun pengguna.</p>
            </div>
            {user ? (
              <div className="space-y-2">
                <Label htmlFor={`${id}-active`}>Status akun</Label>
                <select id={`${id}-active`} name="isActive" defaultValue={String(user.isActive)} className={selectClassName}>
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
                <p className="text-sm text-muted-foreground">Akun nonaktif tidak dapat login. Riwayat transaksinya tetap tersimpan.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={`${id}-password`}>Password awal</Label>
                <Input id={`${id}-password`} name="password" type="password" minLength={8} maxLength={72} required autoComplete="new-password" aria-describedby={`${id}-password-help`} />
                <p id={`${id}-password-help`} className="text-sm text-muted-foreground">Minimal 8 karakter. Pengguna dapat menggantinya melalui Profil.</p>
              </div>
            )}
          </fieldset>
          {isCurrentUser ? <p className="text-sm text-muted-foreground">Perubahan email, hak akses, atau status akun Anda akan meminta Anda login ulang.</p> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : user ? "Simpan Perubahan" : "Tambah Pengguna"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
