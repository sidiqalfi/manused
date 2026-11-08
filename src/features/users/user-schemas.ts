import { z } from "zod"

export const accountRoleSchema = z.enum(["ADMIN", "USER"])
export const accountPasswordSchema = z.string()
  .min(8, "Password minimal 8 karakter")
  .refine((value) => new TextEncoder().encode(value).length <= 72, {
    message: "Password maksimal 72 byte",
  })

const accountFields = {
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Email tidak valid")),
  role: accountRoleSchema,
}

export const createUserSchema = z.object({ ...accountFields, password: accountPasswordSchema })
export const updateUserSchema = z.object({
  ...accountFields,
  id: z.uuid("ID pengguna tidak valid"),
  isActive: z.boolean(),
})
export const resetUserPasswordSchema = z.object({
  id: z.uuid("ID pengguna tidak valid"),
  password: accountPasswordSchema,
})

export const USER_ACCESS_LABELS = { ADMIN: "Administrator", USER: "Pengguna" } as const
