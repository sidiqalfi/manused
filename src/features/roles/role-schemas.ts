import { z } from "zod"

export const roleIdSchema = z.string().uuid()
export const memberIdSchema = z.string().uuid()

export const updateMemberRolesSchema = z.object({
  memberId: memberIdSchema,
  roleIds: z.array(roleIdSchema),
})

export function getRoleIdsFromFormData(formData: FormData): string[] {
  return formData.getAll("roleIds").map((v) => String(v))
}
