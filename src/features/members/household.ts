export interface HouseholdMemberLike {
  headOfHouseholdId?: string | null
}

export type SlotMemberLike = HouseholdMemberLike & { id: string; status?: string }

/**
 * Slot keluarga = kepala rumah yang masih hidup di sistem: dia sendiri ACTIVE,
 * ATAU masih punya minimal satu anggota rumah yang ACTIVE (kasus tuan rumah
 * sudah inactive tapi adik/kakak tetap berangkat & bayar).
 */
export function hasActiveSlot(
  head: SlotMemberLike,
  allMembers: SlotMemberLike[],
): boolean {
  if (head.headOfHouseholdId != null) return false
  if (head.status === "ACTIVE") return true
  return allMembers.some(
    (m) => m.headOfHouseholdId === head.id && m.status === "ACTIVE",
  )
}

/** Semua head dengan slot aktif, dari list penuh members (head + follower). */
export function activeSlotHeads<T extends SlotMemberLike>(members: T[]): T[] {
  return members.filter((m) => hasActiveSlot(m, members))
}

export function isHead(m: HouseholdMemberLike): boolean {
  return m.headOfHouseholdId == null
}

export function householdHeads<T extends HouseholdMemberLike>(members: T[]): T[] {
  return members.filter((m) => isHead(m))
}

export function followersOf<T extends HouseholdMemberLike>(
  headId: string,
  members: T[],
): T[] {
  return members.filter((m) => m.headOfHouseholdId === headId)
}
