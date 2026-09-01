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
import { Shuffle } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { previewArisanDraw } from "../actions/preview-arisan-draw"
import { performArisanDraw } from "../actions/perform-arisan-draw"
import { arisanKeys } from "../queries"
import { formatCurrency } from "@/lib/format"

type Props = {
  periodId: string
  payoutTarget: number
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
}

type Preview = {
  winnerMemberId: string
  winnerName: string
  cycleNumber: number
}

export function DrawDialog({ periodId, payoutTarget, triggerVariant = "default" }: Props) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  async function handleOpen() {
    setOpen(true)
    setPreview(null)
    setError(null)
    setLoading(true)

    const formData = new FormData()
    formData.set("periodId", periodId)
    const result = await previewArisanDraw(formData)

    setLoading(false)
    if (result.success && result.data) {
      setPreview(result.data)
    } else {
      setError(result.error ?? "Gagal mengocok arisan")
    }
  }

  async function handleConfirm() {
    if (!preview) return
    setError(null)

    const formData = new FormData()
    formData.set("periodId", periodId)
    formData.set("winnerMemberId", preview.winnerMemberId)
    formData.set("drawnAt", new Date().toISOString().split("T")[0])

    const result = await performArisanDraw(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setPreview(null)
      await queryClient.invalidateQueries({ queryKey: arisanKeys.all })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPreview(null) }}>
      <DialogTrigger
        render={
          <Button size="sm" variant={triggerVariant} onClick={handleOpen}>
            <Shuffle data-icon="inline-start" />
            Kocok
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kocok Arisan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Mengocok nama...</p>
          ) : preview ? (
            <>
              <div className="rounded-2xl bg-muted/50 p-6 text-center ring-1 ring-foreground/5">
                <p className="text-sm text-muted-foreground">Pemenang</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {preview.winnerName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Siklus {preview.cycleNumber} · hadiah {formatCurrency(payoutTarget)}
                </p>
              </div>
              <Button className="w-full" onClick={handleConfirm}>
                Simpan Pemenang
              </Button>
            </>
          ) : null}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!loading && !preview && !error && (
            <p className="text-sm text-muted-foreground">
              Menyiapkan kocokan...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
