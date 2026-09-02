"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import type { Member, Role } from "@/generated/prisma/client"
import { updateMember } from "@features/members/actions/update-member"
import { membersKeys } from "@features/members/queries"
import { updateMemberRoles } from "@/features/roles/actions/update-member-roles"
import { rolesKeys } from "@/features/roles/queries"

interface EditMemberDialogProps {
  member: Member
  allRoles: Role[]
  currentRoleIds: string[]
}

export function EditMemberDialog({
  member,
  allRoles,
  currentRoleIds,
}: EditMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const birthDateValue = new Date(member.birthDate)
    .toISOString()
    .split("T")[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const roleIds = formData.getAll("roleIds").map((v) => String(v))

    const result = await updateMember(member.id, formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    const rolesResult = await updateMemberRoles(member.id, roleIds)
    if (rolesResult.error) {
      setError(rolesResult.error)
      setLoading(false)
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: membersKeys.all }),
      queryClient.invalidateQueries({ queryKey: rolesKeys.all }),
    ])
    setLoading(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={`Edit ${member.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Anggota</DialogTitle>
          <DialogDescription>
            Ubah data anggota di bawah ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>
              <Label>Nama Panggilan</Label>
            </FieldLabel>
            <Input
              name="name"
              defaultValue={member.name}
              placeholder="Contoh: Andi"
              required
            />
          </Field>

          <Field>
            <FieldLabel>
              <Label>Nama Lengkap</Label>
            </FieldLabel>
            <Input
              name="fullName"
              defaultValue={member.fullName}
              placeholder="Contoh: Andi Prasetyo"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                <Label>Gender</Label>
              </FieldLabel>
              <Select name="gender" defaultValue={member.gender} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Laki-laki</SelectItem>
                  <SelectItem value="FEMALE">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>
                <Label>Tanggal Lahir</Label>
              </FieldLabel>
              <Input
                name="birthDate"
                type="date"
                defaultValue={birthDateValue}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field>
              <FieldLabel>
                <Label>Dusun</Label>
              </FieldLabel>
              <Input
                name="address"
                defaultValue={member.address}
                placeholder="Contoh: Krajan"
                required
              />
            </Field>

            <Field>
              <FieldLabel>
                <Label>RT</Label>
              </FieldLabel>
              <Input
                name="rt"
                defaultValue={member.rt}
                inputMode="numeric"
                pattern="\d{3}"
                maxLength={3}
                placeholder="013"
                required
              />
            </Field>

            <Field>
              <FieldLabel>
                <Label>RW</Label>
              </FieldLabel>
              <Input
                name="rw"
                defaultValue={member.rw}
                inputMode="numeric"
                pattern="\d{3}"
                maxLength={3}
                placeholder="006"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                <Label>No. HP (opsional)</Label>
              </FieldLabel>
              <Input
                name="phone"
                type="tel"
                defaultValue={member.phone ?? ""}
                placeholder="Contoh: 081234567890"
              />
            </Field>

            <Field>
              <FieldLabel>
                <Label>Status</Label>
              </FieldLabel>
              <Select name="status" defaultValue={member.status} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel>
              <Label>Role Kepengurusan</Label>
            </FieldLabel>
            <div className="flex flex-wrap gap-3">
              {allRoles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="roleIds"
                    value={role.id}
                    defaultChecked={currentRoleIds.includes(role.id)}
                    className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span>{role.name}</span>
                </label>
              ))}
            </div>
          </Field>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
