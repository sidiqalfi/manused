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

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const result = useQuery(initialSaveQuery).data ?? null
  const loading = useQuery(initialSaveQuery).isPending
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Pengaturan umum aplikasi.
        </p>
      </div>

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
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {saved && (
                <p className="text-sm text-primary">Saldo awal tersimpan.</p>
              )}
              <Button type="submit">Simpan</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
