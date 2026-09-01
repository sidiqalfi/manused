import { z } from "zod"

const positiveInt = z.number().int().positive()
const nonNegativeInt = z.number().int().min(0)

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  })
  .transform((value) => new Date(`${value}T00:00:00.000Z`))

export const ARISAN_INITIAL_SAVE_KEY = "arisan.initialSave"

export const createArisanPeriodSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  contributionAmount: positiveInt,
  payoutTarget: positiveInt,
})

export const arisanPeriodIdSchema = z.string().uuid()

export const createArisanIncomeSchema = z.object({
  periodId: z.string().uuid(),
  memberId: z.string().uuid(),
  amount: positiveInt,
  paidAt: dateOnly,
  note: z.string().trim().optional().nullable(),
})

export const arisanIncomeIdSchema = z.string().uuid()

export const arisanDrawIdSchema = z.string().uuid()

export const performArisanDrawSchema = z.object({
  periodId: z.string().uuid(),
  winnerMemberId: z.string().uuid(),
  drawnAt: dateOnly,
})

export const initialSaveSchema = nonNegativeInt

export function getArisanPeriodFormValues(formData: FormData) {
  return {
    month: Number(formData.get("month")),
    year: Number(formData.get("year")),
    contributionAmount: Number(formData.get("contributionAmount")),
    payoutTarget: Number(formData.get("payoutTarget")),
  }
}

export function getArisanIncomeFormValues(formData: FormData) {
  return {
    periodId: formData.get("periodId"),
    memberId: formData.get("memberId"),
    amount: Number(formData.get("amount")),
    paidAt: formData.get("paidAt"),
    note: formData.get("note"),
  }
}

export function getInitialSaveFormValues(formData: FormData) {
  return {
    initialSave: Number(formData.get("initialSave")),
  }
}

export function getPerformArisanDrawFormValues(formData: FormData) {
  return {
    periodId: formData.get("periodId"),
    winnerMemberId: formData.get("winnerMemberId"),
    drawnAt: formData.get("drawnAt"),
  }
}
