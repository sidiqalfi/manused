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
import type { Member, Position } from "@/generated/prisma/client"
import { updateMember } from "@features/members/actions/update-member"
import { membersKeys } from "@features/members/queries"
import { updateMemberPositions } from "@/features/positions/actions/update-member-positions"
import { positionsKeys } from "@/features/positions/queries"
import { householdHeads } from "@features/members/household"

interface EditMemberDialogProps {
  member: Member
  allPositions: Position[]
  currentPositionIds: string[]
  allMembers?: Member[]
}

export function EditMemberDialog({
  member,
  allPositions,
  currentPositionIds,
  allMembers = [],
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
    const positionIds = formData.getAll("positionIds").map((v) => String(v))

    const result = await updateMember(member.id, formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    const positionsResult = await updateMemberPositions(member.id, positionIds)
    if (positionsResult.error) {
      setError(positionsResult.error)
      setLoading(false)
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: membersKeys.all }),
      queryClient.invalidateQueries({ queryKey: positionsKeys.all }),
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
            className="h-8 w-8 text-blue-600 hover:text-blue-700"
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
              <Label>Kepala Rumah (opsional)</Label>
            </FieldLabel>
            <Select
              name="headOfHouseholdId"
              defaultValue={member.headOfHouseholdId ?? "__none__"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kepala rumah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sendiri —</SelectItem>
                {householdHeads(allMembers)
                  .filter((head) => head.id !== member.id)
                  .map((head) => (
                    <SelectItem key={head.id} value={head.id}>
                      {head.name} - {head.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>
              <Label>Jabatan Kepengurusan</Label>
            </FieldLabel>
            <div className="flex flex-wrap gap-3">
              {allPositions.map((position) => (
                <label
                  key={position.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="positionIds"
                    value={position.id}
                    defaultChecked={currentPositionIds.includes(position.id)}
                    className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span>{position.name}</span>
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
