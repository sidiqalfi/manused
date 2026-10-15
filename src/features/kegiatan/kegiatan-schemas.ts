import { z } from "zod"

const requiredText = z.string().trim().min(1)
const nonNegativeInt = z.number().int().min(0)

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  })
  .transform((value) => new Date(`${value}T00:00:00.000Z`))

export const KEGIATAN_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Direncanakan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
}

export const createKegiatanSchema = z.object({
  name: requiredText,
  eventDate: dateOnly,
  location: z.string().trim().optional().nullable(),
  feePerPerson: nonNegativeInt,
  status: z.enum(["PLANNED", "COMPLETED", "CANCELLED"]).default("PLANNED"),
  note: z.string().trim().optional().nullable(),
})

export const kegiatanIdSchema = z.string().uuid()

export const updateKegiatanSchema = createKegiatanSchema.partial().extend({
  id: z.string().uuid(),
})

export const addKegiatanParticipantsBatchSchema = z
  .object({
    kegiatanId: z.string().uuid(),
    memberIds: z.array(z.string().uuid()),
  })
  .refine((data) => data.memberIds.length > 0, {
    message: "Pilih minimal satu anggota",
    path: ["memberIds"],
  })
  .refine((data) => new Set(data.memberIds).size === data.memberIds.length, {
    message: "Ada anggota duplikat",
    path: ["memberIds"],
  })

export const removeKegiatanParticipantSchema = z.object({
  kegiatanId: z.string().uuid(),
  memberId: z.string().uuid(),
})

// Tidak ada @@unique di KegiatanPayment — pembayaran parsial / cicilan
// diperbolehkan, jadi satu member boleh punya beberapa record pembayaran.
export const createKegiatanPaymentSchema = z.object({
  kegiatanId: z.string().uuid(),
  memberId: z.string().uuid(),
  amount: z.number().int().positive(),
  paidAt: dateOnly,
  note: z.string().trim().optional().nullable(),
})

export const kegiatanPaymentIdSchema = z.string().uuid()

export const createKegiatanExpenseSchema = z.object({
  kegiatanId: z.string().uuid(),
  description: requiredText,
  amount: z.number().int().positive(),
  spentAt: dateOnly,
})

export const kegiatanExpenseIdSchema = z.string().uuid()

// Link/unlink CashExpense ↔ Kegiatan (subsidi kas).
export const linkCashExpenseSchema = z.object({
  expenseId: z.string().uuid(),
  kegiatanId: z.string().uuid(),
})

export const unlinkCashExpenseSchema = z.object({
  expenseId: z.string().uuid(),
})

export function getCreateKegiatanFormValues(formData: FormData) {
  return {
    name: formData.get("name"),
    eventDate: formData.get("eventDate"),
    location: formData.get("location"),
    feePerPerson: Number(formData.get("feePerPerson")),
    status: formData.get("status"),
    note: formData.get("note"),
  }
}

export function getUpdateKegiatanFormValues(formData: FormData) {
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    eventDate: formData.get("eventDate"),
    location: formData.get("location"),
    feePerPerson: Number(formData.get("feePerPerson")),
    status: formData.get("status"),
    note: formData.get("note"),
  }
}

export function getAddParticipantsFormValues(formData: FormData) {
  return {
    kegiatanId: formData.get("kegiatanId"),
    memberIds: formData.getAll("memberIds"),
  }
}

export function getRemoveParticipantFormValues(formData: FormData) {
  return {
    kegiatanId: formData.get("kegiatanId"),
    memberId: formData.get("memberId"),
  }
}

export function getKegiatanPaymentFormValues(formData: FormData) {
  return {
    kegiatanId: formData.get("kegiatanId"),
    memberId: formData.get("memberId"),
    amount: Number(formData.get("amount")),
    paidAt: formData.get("paidAt"),
    note: formData.get("note"),
  }
}

export function getKegiatanExpenseFormValues(formData: FormData) {
  return {
    kegiatanId: formData.get("kegiatanId"),
    description: formData.get("description"),
    amount: Number(formData.get("amount")),
    spentAt: formData.get("spentAt"),
  }
}

export function getLinkCashExpenseFormValues(formData: FormData) {
  return {
    expenseId: formData.get("expenseId"),
    kegiatanId: formData.get("kegiatanId"),
  }
}

export function getUnlinkCashExpenseFormValues(formData: FormData) {
  return {
    expenseId: formData.get("expenseId"),
  }
}
