"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { resetUserPassword } from "../actions/reset-user-password"
import { useUserMutation } from "../hooks/use-user-mutation"
import type { ManagedUser } from "../user-select"

export function ResetPasswordDialog({ user, onSaved }: { user: ManagedUser; onSaved: (message: string) => void }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const { error, setError, pending, submit } = useUserMutation(() => {
    setOpen(false)
    onSaved(`Password ${user.name ?? user.email} berhasil direset.`)
  })

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) { setError(null); setOpen(next) } }}>
      <DialogTrigger render={<Button size="sm" variant="ghost" aria-label={`Reset password ${user.name ?? user.email}`} />}>Reset Password</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>Ganti password untuk {user.name ?? user.email}. Semua sesi akun ini akan berakhir dan pengguna harus login ulang.</DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          if (data.get("password") !== data.get("confirmPassword")) {
            setError("Konfirmasi password tidak cocok.")
            return
          }
          submit(resetUserPassword, data)
        }}>
          <input type="hidden" name="id" value={user.id} />
          <fieldset disabled={pending} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-password`}>Password baru</Label>
              <Input id={`${id}-password`} type="password" name="password" required minLength={8} maxLength={72} autoComplete="new-password" aria-describedby={`${id}-help`} />
              <p id={`${id}-help`} className="text-sm text-muted-foreground">Gunakan minimal 8 karakter.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-confirm`}>Konfirmasi password baru</Label>
              <Input id={`${id}-confirm`} type="password" name="confirmPassword" required minLength={8} maxLength={72} autoComplete="new-password" />
            </div>
          </fieldset>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Reset Password"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
