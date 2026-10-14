"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { createSosialIncome } from "../../actions/create-sosial-income"
import { sosialKeys } from "../../queries"
import { SOSIAL_MIN_CONTRIBUTION } from "../../sosial-schemas"
import type { MemberArrears } from "@/lib/payments/arrears"
import { formatCurrency } from "@/lib/format"

type Member = {
  id: string
  name: string
  fullName: string
}

type Props = {
  periodId: string
  unpaidMembers: Member[]
  minAmount: number
  /** Tunggakan bulan-bulan sebelumnya per memberId (opsional) */
  arrears?: Map<string, MemberArrears>
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
}

export function RecordSosialContributionDialog({
  periodId,
  unpaidMembers,
  minAmount,
  arrears,
  triggerVariant = "default",
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const selectedArrears = arrears?.get(selectedMemberId)
  const queryClient = useQueryClient()

  const today = new Date().toISOString().split("T")[0]

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createSosialIncome(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: sosialKeys.all })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant={triggerVariant}>
            <Plus data-icon="inline-start" />
            Catat Iuran
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Iuran Sosial</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="periodId" value={periodId} />

          <div className="space-y-2">
            <Label htmlFor="memberId">Anggota</Label>
            <select
              name="memberId"
              id="memberId"
              required
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Pilih Anggota</option>
              {unpaidMembers.map((m) => {
                const owed = arrears?.get(m.id)
                return (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.fullName}
                    {owed ? ` (nunggak ${owed.count} bln)` : ""}
                  </option>
                )
              })}
            </select>
            {selectedArrears && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                ⚠️ Anggota ini nunggak {selectedArrears.count} bulan sebelumnya
                (total {formatCurrency(selectedArrears.amount)}). Iuran bulan
                ini saja yang dicatat di sini.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Nominal (min: Rp {minAmount.toLocaleString("id-ID")})
            </Label>
            <Input
              type="number"
              name="amount"
              id="amount"
              defaultValue={minAmount}
              min={SOSIAL_MIN_CONTRIBUTION}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAt">Tanggal Bayar</Label>
            <Input
              type="date"
              name="paidAt"
              id="paidAt"
              defaultValue={today}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Catatan (opsional)</Label>
            <Input
              type="text"
              name="note"
              id="note"
              placeholder="Titip bulan lalu, dll"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full">Catat Iuran</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
