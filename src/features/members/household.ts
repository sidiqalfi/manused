export interface HouseholdMemberLike {
  headOfHouseholdId?: string | null
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
