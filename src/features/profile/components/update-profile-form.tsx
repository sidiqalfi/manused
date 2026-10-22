"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { updateProfile } from "../actions/update-profile"
import { profileKeys, profileQuery } from "../queries"

export function UpdateProfileForm() {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const queryClient = useQueryClient()

  const query = useQuery(profileQuery)
  const profile = query.data?.success ? query.data.data : null

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    const result = await updateProfile(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      await queryClient.invalidateQueries({ queryKey: profileKeys.all })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ubah Nama</CardTitle>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-24" />
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama tampilan</Label>
              <Input
                type="text"
                name="name"
                id="name"
                defaultValue={profile?.name ?? ""}
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                Perubahan di sidebar akan muncul setelah login ulang.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && <p className="text-sm text-primary">Nama tersimpan.</p>}
            <Button type="submit">Simpan</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
