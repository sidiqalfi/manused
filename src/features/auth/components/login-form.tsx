"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useActionState } from "react"
import { loginAction } from "@/features/auth/actions/auth"
import { guestLoginAction } from "@/features/auth/actions/guest-login"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, formAction, isPending] = useActionState(loginAction, null)
  const [guestError, guestFormAction, isGuestPending] = useActionState(
    guestLoginAction,
    null
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Masuk ke Akun</CardTitle>
          <CardDescription>
            Masukkan email kamu untuk masuk ke akun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              {error && (
                <p className="text-sm text-red-500" role="alert">{error}</p>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="**********"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Memproses..." : "Masuk"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          {guestError && (
            <p className="mt-2 text-sm text-red-500" role="alert">{guestError}</p>
          )}
          <form action={guestFormAction} className="mt-4">
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={isGuestPending}
            >
              {isGuestPending ? "Memproses..." : "Masuk sebagai Tamu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
