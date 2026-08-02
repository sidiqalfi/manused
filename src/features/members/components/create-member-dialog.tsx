"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
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
import { createMember } from "@features/members/actions/create-member"

export function CreateMemberDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createMember(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus data-icon="inline-start" />
            Tambah Anggota
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Anggota Baru</DialogTitle>
          <DialogDescription>
            Isi data di bawah untuk menambahkan anggota baru.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>
              <Label>Nama Panggilan</Label>
            </FieldLabel>
            <Input name="name" placeholder="Contoh: Andi" required />
          </Field>

          <Field>
            <FieldLabel>
              <Label>Nama Lengkap</Label>
            </FieldLabel>
            <Input
              name="fullName"
              placeholder="Contoh: Andi Prasetyo"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                <Label>Gender</Label>
              </FieldLabel>
              <Select name="gender" required>
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
              <Input name="birthDate" type="date" required />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field>
              <FieldLabel>
                <Label>Dusun</Label>
              </FieldLabel>
              <Input name="address" placeholder="Contoh: Krajan" required />
            </Field>

            <Field>
              <FieldLabel>
                <Label>RT</Label>
              </FieldLabel>
              <Input
                name="rt"
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
                inputMode="numeric"
                pattern="\d{3}"
                maxLength={3}
                placeholder="006"
                required
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>
              <Label>No. HP (opsional)</Label>
            </FieldLabel>
            <Input
              name="phone"
              type="tel"
              placeholder="Contoh: 081234567890"
            />
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
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
