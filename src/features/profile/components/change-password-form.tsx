"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword } from "../actions/change-password"

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSubmitting(true)
    try {
      const result = await changePassword(formData)
      if (result.error) {
        setError(result.error)
      } else {
        // Session cookie sudah di-clear di server; redirect ke login.
        router.push("/signin")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ganti Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password lama</Label>
            <Input
              type="password"
              name="currentPassword"
              id="currentPassword"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password baru</Label>
            <Input
              type="password"
              name="newPassword"
              id="newPassword"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimal 8 karakter. Setelah berhasil, kamu akan diminta login
              ulang.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
            <Input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : "Ganti Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
