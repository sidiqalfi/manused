"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Undo2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { voidArisanDraw } from "../actions/void-arisan-draw"
import { arisanKeys } from "../queries"
import { formatCurrency, formatDate } from "@/lib/format"

type Draw = {
  id: string
  winnerName: string
  cycleNumber: number
  collectedAmount: number
  payoutAmount: number
  savingsAfter: number
  drawnAt: Date
  voided: boolean
}

type Props = {
  draws: Draw[] | null
  loading: boolean
}

export function ArisanDrawHistory({ draws, loading }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [voidingDraw, setVoidingDraw] = useState<Draw | null>(null)
  const queryClient = useQueryClient()

  async function handleVoid() {
    if (!voidingDraw) return
    const result = await voidArisanDraw(voidingDraw.id)
    setVoidingDraw(null)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: arisanKeys.all })
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Riwayat Kocokan</h3>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Pemenang</th>
              <th className="p-3 text-left text-sm font-medium">Siklus</th>
              <th className="p-3 text-left text-sm font-medium">Terkumpul</th>
              <th className="p-3 text-left text-sm font-medium">Dibayarkan</th>
              <th className="p-3 text-left text-sm font-medium">Save</th>
              <th className="p-3 text-left text-sm font-medium">Tanggal</th>
              <th className="p-3 text-right text-sm font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-sm text-muted-foreground">
                  Memuat riwayat...
                </td>
              </tr>
            )}
            {!loading && (!draws || draws.length === 0) && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-sm text-muted-foreground">
                  Belum ada kocokan tercatat
                </td>
              </tr>
            )}
            {(draws ?? []).map((draw) => (
              <tr key={draw.id} className="border-b">
                <td className="p-3 text-sm font-medium">{draw.winnerName}</td>
                <td className="p-3 text-sm">{draw.cycleNumber}</td>
                <td className="p-3 text-sm">{formatCurrency(draw.collectedAmount)}</td>
                <td className="p-3 text-sm">{formatCurrency(draw.payoutAmount)}</td>
                <td className="p-3 text-sm tabular-nums">
                  {formatCurrency(draw.collectedAmount - draw.payoutAmount)}
                </td>
                <td className="p-3 text-sm">{formatDate(draw.drawnAt)}</td>
                <td className="p-3 text-right">
                  {draw.voided ? (
                    <Badge variant="outline">Dibatalkan</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Batalkan"
                      onClick={() => setVoidingDraw(draw)}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={voidingDraw !== null}
        onOpenChange={(open) => !open && setVoidingDraw(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan kocokan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kocokan {voidingDraw?.winnerName} akan ditandai batal dan tidak
              dihitung. Periode bisa di-kocok ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleVoid}>
              Batalkan Kocokan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
