import { z } from "zod"

const requiredText = z.string().trim().min(1)
const administrativeCode = z.string().regex(/^\d{3}$/)

const birthDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    )
  })
  .transform((value) => new Date(`${value}T00:00:00.000Z`))

const phone = z
  .union([z.string(), z.null()])
  .transform((value) => value?.trim() || null)

export const createMemberSchema = z.object({
  name: requiredText,
  fullName: requiredText,
  gender: z.enum(["MALE", "FEMALE"]),
  birthDate,
  address: requiredText,
  rt: administrativeCode,
  rw: administrativeCode,
  phone,
})

export const updateMemberSchema = createMemberSchema.extend({
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

export const memberIdSchema = z.string().uuid()

export function getMemberFormValues(formData: FormData) {
  return {
    name: formData.get("name"),
    fullName: formData.get("fullName"),
    gender: formData.get("gender"),
    birthDate: formData.get("birthDate"),
    address: formData.get("address"),
    rt: formData.get("rt"),
    rw: formData.get("rw"),
    phone: formData.get("phone"),
    status: formData.get("status"),
  }
}
