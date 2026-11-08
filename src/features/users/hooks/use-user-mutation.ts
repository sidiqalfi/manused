"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { usersKeys } from "../queries"
import type { UserActionResult } from "../user-select"

export function useUserMutation(onSuccess: () => void) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const queryClient = useQueryClient()
  const router = useRouter()

  function submit(action: (data: FormData) => Promise<UserActionResult>, data: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await action(data)
        if (!result.success) {
          setError(result.error ?? "Perubahan gagal disimpan. Silakan coba lagi.")
          return
        }
        if (result.sessionRevoked) {
          queryClient.clear()
          router.replace("/signin")
          router.refresh()
          return
        }
        onSuccess()
        await queryClient.invalidateQueries({ queryKey: usersKeys.all })
        router.refresh()
      } catch {
        setError("Tidak dapat terhubung. Periksa koneksi lalu coba lagi.")
      }
    })
  }

  return { error, setError, pending, submit }
}
