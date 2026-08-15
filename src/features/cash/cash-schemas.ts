import { z } from "zod"

const requiredText = z.string().trim().min(1)
const positiveInt = z.number().int().positive()

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  })
  .transform((value) => new Date(`${value}T00:00:00.000Z`))

export const createCashPeriodSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  duesAmount: positiveInt,
  minAmount: positiveInt,
})

export const cashPeriodIdSchema = z.string().uuid()

export const createCashIncomeSchema = z.object({
  periodId: z.string().uuid(),
  memberId: z.string().uuid(),
  amount: positiveInt,
  paidAt: dateOnly,
  note: z.string().trim().optional().nullable(),
})

export const cashIncomeIdSchema = z.string().uuid()

export const createCashExpenseSchema = z.object({
  periodId: z.string().uuid(),
  description: requiredText,
  amount: positiveInt,
  spentAt: dateOnly,
})

export const cashExpenseIdSchema = z.string().uuid()

export function getCashPeriodFormValues(formData: FormData) {
  return {
    month: Number(formData.get("month")),
    year: Number(formData.get("year")),
    duesAmount: Number(formData.get("duesAmount")),
    minAmount: Number(formData.get("minAmount")),
  }
}

export function getCashIncomeFormValues(formData: FormData) {
  return {
    periodId: formData.get("periodId"),
    memberId: formData.get("memberId"),
    amount: Number(formData.get("amount")),
    paidAt: formData.get("paidAt"),
    note: formData.get("note"),
  }
}

export function getCashExpenseFormValues(formData: FormData) {
  return {
    periodId: formData.get("periodId"),
    description: formData.get("description"),
    amount: Number(formData.get("amount")),
    spentAt: formData.get("spentAt"),
  }
}
