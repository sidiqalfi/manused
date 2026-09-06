import { z } from "zod"

const requiredText = z.string().trim().min(1)
const positiveInt = z.number().int().positive()
const nonNegativeInt = z.number().int().min(0)

export const SOSIAL_INITIAL_BALANCE_KEY = "sosial.initialBalance"

export const initialBalanceSchema = nonNegativeInt

export function getInitialBalanceFormValues(formData: FormData) {
  return {
    initialBalance: Number(formData.get("initialBalance")),
  }
}

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  })
  .transform((value) => new Date(`${value}T00:00:00.000Z`))

export const createSosialPeriodSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  minAmount: positiveInt,
})

export const sosialPeriodIdSchema = z.string().uuid()

export const createSosialIncomeSchema = z.object({
  periodId: z.string().uuid(),
  memberId: z.string().uuid(),
  amount: positiveInt,
  paidAt: dateOnly,
  note: z.string().trim().optional().nullable(),
})

export const createSosialIncomesBatchSchema = z
  .object({
    mode: z.enum(["all", "selected"]),
    periodId: z.string().uuid(),
    memberIds: z.array(z.string().uuid()),
    amount: positiveInt,
    paidAt: dateOnly,
    note: z.string().trim().optional().nullable(),
  })
  .refine((data) => data.mode === "all" || data.memberIds.length > 0, {
    message: "Pilih minimal satu anggota",
    path: ["memberIds"],
  })

export const sosialIncomeIdSchema = z.string().uuid()

export const createSosialExpenseSchema = z.object({
  periodId: z.string().uuid(),
  description: requiredText,
  amount: positiveInt,
  spentAt: dateOnly,
})

export const sosialExpenseIdSchema = z.string().uuid()

export function getSosialPeriodFormValues(formData: FormData) {
  return {
    month: Number(formData.get("month")),
    year: Number(formData.get("year")),
    minAmount: Number(formData.get("minAmount")),
  }
}

export function getSosialIncomeFormValues(formData: FormData) {
  return {
    periodId: formData.get("periodId"),
    memberId: formData.get("memberId"),
    amount: Number(formData.get("amount")),
    paidAt: formData.get("paidAt"),
    note: formData.get("note"),
  }
}

export function getSosialIncomeBatchFormValues(formData: FormData) {
  return {
    mode: formData.get("mode"),
    periodId: formData.get("periodId"),
    memberIds: formData.getAll("memberIds"),
    amount: Number(formData.get("amount")),
    paidAt: formData.get("paidAt"),
    note: formData.get("note"),
  }
}

export function getSosialExpenseFormValues(formData: FormData) {
  return {
    periodId: formData.get("periodId"),
    description: formData.get("description"),
    amount: Number(formData.get("amount")),
    spentAt: formData.get("spentAt"),
  }
}
