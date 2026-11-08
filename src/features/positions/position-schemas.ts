import { z } from "zod"

export const positionIdSchema = z.string().uuid()
export const memberIdSchema = z.string().uuid()

export const updateMemberPositionsSchema = z.object({
  memberId: memberIdSchema,
  positionIds: z.array(positionIdSchema),
})

export function getPositionIdsFromFormData(formData: FormData): string[] {
  return formData.getAll("positionIds").map((v) => String(v))
}
