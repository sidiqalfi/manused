"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { setInitialSave } from "@/features/arisan/actions/set-initial-save"
import { initialSaveQuery, arisanKeys } from "@/features/arisan/queries"
import { setCashInitialBalance } from "@/features/cash/actions/set-initial-balance"
import { cashInitialBalanceQuery, cashKeys } from "@/features/cash/queries"
import { setSosialInitialBalance } from "@/features/sosial/actions/set-initial-balance"
import { sosialInitialBalanceQuery, sosialKeys } from "@/features/sosial/queries"

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Pengaturan umum aplikasi.
        </p>
      </div>

      <CashInitialBalanceCard />
      <SosialInitialBalanceCard />
      <ArisanInitialSaveCard />
    </div>
  )
}

function CashInitialBalanceCard() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const query = useQuery(cashInitialBalanceQuery)
  const result = query.data ?? null
  const loading = query.isPending
  const initialBalance = result?.success ? result.data?.initialBalance ?? 0 : 0

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    const saveResult = await setCashInitialBalance(formData)
    if (saveResult.error) {
      setError(saveResult.error)
    } else {
      setSaved(true)
      await queryClient.invalidateQueries({ queryKey: cashKeys.all })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo Awal Dana Kas</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cashInitialBalance">Saldo awal (Rp)</Label>
              <Input
                type="number"
                name="initialBalance"
                id="cashInitialBalance"
                defaultValue={initialBalance}
                min={0}
                required
              />
              <p className="text-xs text-muted-foreground">
                Saldo kas yang sudah ada sebelum pencatatan dimulai.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && (
              <p className="text-sm text-primary">Saldo awal tersimpan.</p>
            )}
            <Button type="submit">Simpan</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function SosialInitialBalanceCard() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const query = useQuery(sosialInitialBalanceQuery)
  const result = query.data ?? null
  const loading = query.isPending
  const initialBalance = result?.success ? result.data?.initialBalance ?? 0 : 0

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    const saveResult = await setSosialInitialBalance(formData)
    if (saveResult.error) {
      setError(saveResult.error)
    } else {
      setSaved(true)
      await queryClient.invalidateQueries({ queryKey: sosialKeys.all })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo Awal Dana Sosial</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sosialInitialBalance">Saldo awal (Rp)</Label>
              <Input
                type="number"
                name="initialBalance"
                id="sosialInitialBalance"
                defaultValue={initialBalance}
                min={0}
                required
              />
              <p className="text-xs text-muted-foreground">
                Saldo sosial yang sudah ada sebelum pencatatan dimulai.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && (
              <p className="text-sm text-primary">Saldo awal tersimpan.</p>
            )}
            <Button type="submit">Simpan</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function ArisanInitialSaveCard() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const query = useQuery(initialSaveQuery)
  const result = query.data ?? null
  const loading = query.isPending
  const initialSave = result?.success ? result.data?.initialSave ?? 0 : 0

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    const saveResult = await setInitialSave(formData)
    if (saveResult.error) {
      setError(saveResult.error)
    } else {
      setSaved(true)
      await queryClient.invalidateQueries({ queryKey: arisanKeys.initialSave() })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo Awal Dana Save Arisan</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initialSave">Saldo awal (Rp)</Label>
              <Input
                type="number"
                name="initialSave"
                id="initialSave"
                defaultValue={initialSave}
                min={0}
                required
              />
              <p className="text-xs text-muted-foreground">
                Dana save yang sudah ada sebelum pencatatan arisan dimulai.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && (
              <p className="text-sm text-primary">Saldo awal tersimpan.</p>
            )}
            <Button type="submit">Simpan</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
