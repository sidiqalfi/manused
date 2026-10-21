"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import { kegiatanDetailQuery, kegiatanKeys } from "@/features/kegiatan/queries"
import { membersQuery } from "@features/members/queries"
import { KegiatanParticipantsTable } from "@/features/kegiatan/components/kegiatan-participants-table"
import { KegiatanPaymentsTable } from "@/features/kegiatan/components/kegiatan-payments-table"
import { ExportKegiatanButton } from "@/features/kegiatan/components/export-kegiatan-button"
import { EditKegiatanDialog } from "@/features/kegiatan/components/edit-kegiatan-dialog"
import { createKegiatanExpense } from "@/features/kegiatan/actions/create-kegiatan-expense"
import { deleteKegiatanExpense } from "@/features/kegiatan/actions/delete-kegiatan-expense"
import { KEGIATAN_STATUS_LABEL } from "@/features/kegiatan/kegiatan-schemas"
import { formatCurrency, formatDate } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"

type StatusBadgeVariant = "default" | "secondary" | "outline" | "destructive"

const STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  PLANNED: "secondary",
  COMPLETED: "default",
  CANCELLED: "outline",
}

export default function KegiatanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const detailResult = useQuery(kegiatanDetailQuery(slug))
  const membersResult = useQuery(membersQuery)
  const queryClient = useQueryClient()

  const [expenseOpen, setExpenseOpen] = useState(false)
  const [expenseError, setExpenseError] = useState<string | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<{
    id: string
    description: string
    amount: number
  } | null>(null)

  const kegiatan = detailResult.data?.success ? detailResult.data.data : null
  const members = membersResult.data?.success ? membersResult.data.data ?? [] : []

  if (detailResult.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!kegiatan) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          {detailResult.data?.error ?? "Kegiatan tidak ditemukan"}
        </p>
        <Button variant="outline" size="sm" render={<Link href="/dashboard/kegiatan" />}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Kembali
        </Button>
      </div>
    )
  }

  const participants = kegiatan.participants
  const payments = kegiatan.payments
  const expenses = kegiatan.expenses
  const cashSubsidies = kegiatan.relatedCashExpenses

  const paidBy: Record<string, number> = {}
  for (const p of payments) {
    paidBy[p.memberId] = (paidBy[p.memberId] ?? 0) + p.amount
  }

  const totalCollected = Object.values(paidBy).reduce((s, v) => s + v, 0)
  const totalExpense =
    expenses.reduce((s, e) => s + e.amount, 0) +
    cashSubsidies.reduce((s, e) => s + e.amount, 0)
  const expected = kegiatan.feePerPerson * participants.length
  const diff = totalCollected - totalExpense

  const participantPayload = participants.map((p) => ({
    memberId: p.memberId,
    member: p.member,
  }))

  // Payload export: satu baris per peserta, termasuk status member
  // (perlu lookup dari list members penuh).
  const memberStatusById = new Map(
    members.map((m) => [m.id, m.status as string])
  )
  const exportData = participants.map((p) => {
    const paid = paidBy[p.memberId] ?? 0
    return {
      name: p.member.name,
      fullName: p.member.fullName,
      status: memberStatusById.get(p.memberId) ?? "ACTIVE",
      joinedAt: p.joinedAt,
      totalPaid: paid,
      expected: kegiatan.feePerPerson,
      remaining: Math.max(kegiatan.feePerPerson - paid, 0),
      history: payments
        .filter((pay) => pay.memberId === p.memberId)
        .map((pay) => ({ amount: pay.amount, paidAt: pay.paidAt, note: pay.note })),
    }
  })

  async function handleExpenseSubmit(formData: FormData) {
    setExpenseError(null)
    const result = await createKegiatanExpense(formData)
    if (result.error) {
      setExpenseError(result.error)
    } else {
      setExpenseOpen(false)
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
  }

  async function handleExpenseDelete() {
    if (!deletingExpense) return
    const fd = new FormData()
    fd.set("id", deletingExpense.id)
    const result = await deleteKegiatanExpense(fd)
    if (!result.error) {
      await queryClient.invalidateQueries({ queryKey: kegiatanKeys.all })
    }
    setDeletingExpense(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/dashboard/kegiatan" />}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">{kegiatan.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {formatDate(kegiatan.eventDate)}
            </span>
            {kegiatan.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {kegiatan.location}
              </span>
            )}
            <Badge variant={STATUS_VARIANT[kegiatan.status] ?? "outline"}>
              {KEGIATAN_STATUS_LABEL[kegiatan.status] ?? kegiatan.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditKegiatanDialog kegiatan={kegiatan} />
          <ExportKegiatanButton
            kegiatanName={kegiatan.name}
            data={exportData}
            disabled={participants.length === 0}
          />
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Peserta</p>
              <p className="text-lg font-semibold tabular-nums">
                {participants.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                Terkumpul (target {formatCurrency(expected)})
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(totalCollected)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Keluar</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className={`h-5 w-5 ${diff < 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <div>
              <p className="text-xs text-muted-foreground">Selisih</p>
              <p className={`text-lg font-semibold tabular-nums ${diff < 0 ? "text-destructive" : ""}`}>
                {formatCurrency(diff)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab */}
      <Tabs defaultValue="participants">
        <TabsList>
          <TabsTrigger value="participants">Peserta</TabsTrigger>
          <TabsTrigger value="payments">Pembayaran</TabsTrigger>
          <TabsTrigger value="expenses">Pengeluaran</TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <KegiatanParticipantsTable
            kegiatanId={kegiatan.id}
            participants={participants}
            allMembers={members.map((m) => ({
              id: m.id,
              name: m.name,
              fullName: m.fullName,
              status: m.status,
            }))}
          />
        </TabsContent>

        <TabsContent value="payments">
          <KegiatanPaymentsTable
            kegiatanId={kegiatan.id}
            feePerPerson={kegiatan.feePerPerson}
            participants={participantPayload}
            payments={payments}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Pengeluaran kegiatan ({expenses.length}) + subsidi kas tertaut
                ({cashSubsidies.length})
              </p>
              <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="mr-1 h-4 w-4" />
                  Tambah Pengeluaran
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pengeluaran Kegiatan</DialogTitle>
                  </DialogHeader>
                  <form action={handleExpenseSubmit} className="space-y-4">
                    <input type="hidden" name="kegiatanId" value={kegiatan.id} />
                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Input
                        type="text"
                        name="description"
                        id="description"
                        placeholder="Sewa bus, konsumsi, dll"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Nominal (Rp)</Label>
                        <Input type="number" name="amount" id="amount" min={1} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spentAt">Tanggal</Label>
                        <Input
                          type="date"
                          name="spentAt"
                          id="spentAt"
                          defaultValue={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                    {expenseError && <p className="text-sm text-destructive">{expenseError}</p>}
                    <Button type="submit" className="w-full">Simpan</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-center">Sumber</TableHead>
                    <TableHead className="text-center">Nominal</TableHead>
                    <TableHead className="text-center">Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 && cashSubsidies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada pengeluaran. Tautkan subsidi kas dari menu Kas, atau tambah pengeluaran kegiatan.
                      </TableCell>
                    </TableRow>
                  )}
                  {cashSubsidies.map((e) => (
                    <TableRow key={e.id} className="bg-muted/30">
                      <TableCell>
                        {e.description}
                        <span className="block text-xs text-muted-foreground">
                          Periode kas: {e.period ? `${e.period.month}/${e.period.year}` : "–"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">Subsidi Kas</Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-sm">
                        {formatCurrency(e.amount)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {formatDate(e.spentAt)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        kelola di menu Kas
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.description}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">Kegiatan</Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-sm">
                        {formatCurrency(e.amount)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {formatDate(e.spentAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Hapus pengeluaran"
                          onClick={() =>
                            setDeletingExpense({
                              id: e.id,
                              description: e.description,
                              amount: e.amount,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={deletingExpense !== null}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengeluaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingExpense?.description} sebesar{" "}
              {deletingExpense ? formatCurrency(deletingExpense.amount) : ""} akan
              dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleExpenseDelete}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
