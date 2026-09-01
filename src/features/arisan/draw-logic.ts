export type DrawRecord = {
  winnerMemberId: string
  cycleNumber: number
  collectedAmount: number
  payoutAmount: number
  voided: boolean
}

export function activeDraws(draws: DrawRecord[]) {
  return draws.filter((d) => !d.voided)
}

export function hasActiveDraw(draws: DrawRecord[]) {
  return activeDraws(draws).length > 0
}

export function currentCycle(history: DrawRecord[]): number {
  const active = activeDraws(history)
  if (active.length === 0) {
    return 1
  }
  return Math.max(...active.map((d) => d.cycleNumber))
}

export function winnersInCycle(
  history: DrawRecord[],
  cycle: number
): Set<string> {
  return new Set(
    activeDraws(history)
      .filter((d) => d.cycleNumber === cycle)
      .map((d) => d.winnerMemberId)
  )
}

export function eligibleMembers(
  activeMemberIds: string[],
  paidMemberIds: string[],
  won: Set<string>
): string[] {
  const paid = new Set(paidMemberIds)
  return activeMemberIds.filter((id) => paid.has(id) && !won.has(id))
}

export function savings(initialSave: number, history: DrawRecord[]): number {
  return activeDraws(history).reduce(
    (acc, d) => acc + d.collectedAmount - d.payoutAmount,
    initialSave
  )
}

export function pickWinner(ids: string[]): string {
  const random = new Uint32Array(1)
  crypto.getRandomValues(random)
  return ids[random[0] % ids.length]
}
