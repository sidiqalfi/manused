"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Pemenang</TableHead>
              <TableHead>Siklus</TableHead>
              <TableHead>Terkumpul</TableHead>
              <TableHead>Dibayarkan</TableHead>
              <TableHead>Save</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="p-4 text-center text-muted-foreground">
                  Memuat riwayat...
                </TableCell>
              </TableRow>
            )}
            {!loading && (!draws || draws.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="p-4 text-center text-muted-foreground">
                  Belum ada kocokan tercatat
                </TableCell>
              </TableRow>
            )}
            {(draws ?? []).map((draw) => (
              <TableRow key={draw.id}>
                <TableCell className="text-sm font-medium">{draw.winnerName}</TableCell>
                <TableCell className="text-sm">{draw.cycleNumber}</TableCell>
                <TableCell className="text-sm">{formatCurrency(draw.collectedAmount)}</TableCell>
                <TableCell className="text-sm">{formatCurrency(draw.payoutAmount)}</TableCell>
                <TableCell className="text-sm tabular-nums">
                  {formatCurrency(draw.collectedAmount - draw.payoutAmount)}
                </TableCell>
                <TableCell className="text-sm">{formatDate(draw.drawnAt)}</TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
