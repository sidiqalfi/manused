"use client"

import { useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
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
import { CheckCheck, Layers } from "lucide-react"

type Member = {
  id: string
  name: string
  fullName: string
}

type BatchResult = {
  success?: boolean
  error?: string
  count?: number
}

type Props = {
  /** Dialog pencatatan satuan yang sudah ada, dirender apa adanya. */
  singleTrigger: ReactNode
  periodId: string
  unpaidMembers: Member[]
  defaultAmount: number
  minAmount: number
  dialogTitle: string
  submitLabel: string
  keys: { all: readonly string[] }
  batchAction: (formData: FormData) => Promise<BatchResult>
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
  /** Sembunyikan tombol batch & catat-semua (mis. periode arisan sudah di-kocok). */
  showBatch?: boolean
}

export function IncomeRecordActions({
  singleTrigger,
  periodId,
  unpaidMembers,
  defaultAmount,
  minAmount,
  dialogTitle,
  submitLabel,
  keys,
  batchAction,
  triggerVariant = "default",
  showBatch = true,
}: Props) {
  const [batchOpen, setBatchOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(unpaidMembers.map((m) => m.id)),
  )
  const [batchError, setBatchError] = useState<string | null>(null)
  const [allError, setAllError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const today = new Date().toISOString().split("T")[0]

  function resetSelection() {
    setSelected(new Set(unpaidMembers.map((m) => m.id)))
  }

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === unpaidMembers.length
        ? new Set()
        : new Set(unpaidMembers.map((m) => m.id)),
    )
  }

  async function handleBatchSubmit(formData: FormData) {
    setBatchError(null)
    const result = await batchAction(formData)
    if (result.error) {
      setBatchError(result.error)
    } else {
      setBatchOpen(false)
      resetSelection()
      await queryClient.invalidateQueries({ queryKey: keys.all })
    }
  }

  async function handleRecordAll() {
    setAllError(null)
    const formData = new FormData()
    formData.set("mode", "all")
    formData.set("periodId", periodId)
    formData.set("amount", String(defaultAmount))
    formData.set("paidAt", today)
    formData.set("note", "")

    const result = await batchAction(formData)
    if (result.error) {
      setAllError(result.error)
    } else {
      await queryClient.invalidateQueries({ queryKey: keys.all })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {singleTrigger}

      {showBatch && unpaidMembers.length > 0 && (
        <>
          <Dialog
            open={batchOpen}
            onOpenChange={(open) => {
              setBatchOpen(open)
              if (open) {
                resetSelection()
                setBatchError(null)
              }
            }}
          >
            <DialogTrigger
              render={
                <Button size="sm" variant={triggerVariant}>
                  <Layers data-icon="inline-start" />
                  Catat Batch
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
              </DialogHeader>
              <form action={handleBatchSubmit} className="space-y-4">
                <input type="hidden" name="mode" value="selected" />
                <input type="hidden" name="periodId" value={periodId} />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Anggota</Label>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                    >
                      {selected.size === unpaidMembers.length
                        ? "Kosongkan"
                        : "Pilih semua"}
                    </button>
                  </div>
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                    {unpaidMembers.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          name="memberIds"
                          value={m.id}
                          checked={selected.has(m.id)}
                          onChange={() => toggleMember(m.id)}
                          className="h-4 w-4"
                        />
                        <span>
                          {m.name} - {m.fullName}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selected.size} dari {unpaidMembers.length} anggota dipilih
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-amount">
                    Nominal (min: Rp {minAmount.toLocaleString("id-ID")})
                  </Label>
                  <Input
                    type="number"
                    name="amount"
                    id="batch-amount"
                    defaultValue={defaultAmount}
                    min={minAmount}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-paidAt">Tanggal Bayar</Label>
                  <Input
                    type="date"
                    name="paidAt"
                    id="batch-paidAt"
                    defaultValue={today}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-note">Catatan (opsional)</Label>
                  <Input
                    type="text"
                    name="note"
                    id="batch-note"
                    placeholder="Titip bulan lalu, dll"
                  />
                </div>

                {batchError && (
                  <p className="text-sm text-destructive">{batchError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={selected.size === 0}
                >
                  {submitLabel}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button size="sm" variant={triggerVariant} onClick={handleRecordAll}>
            <CheckCheck data-icon="inline-start" />
            Catat Semua
          </Button>
        </>
      )}

      {allError && <p className="text-sm text-destructive">{allError}</p>}
    </div>
  )
}
