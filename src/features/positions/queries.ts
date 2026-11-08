import { queryOptions } from "@tanstack/react-query"
import { getPositions } from "./actions/get-positions"
import { getMemberActivePositionsMap } from "./actions/get-member-active-positions-map"

export const positionsKeys = {
  all: ["positions"] as const,
  list: () => [...positionsKeys.all, "list"] as const,
  memberMap: () => [...positionsKeys.all, "memberMap"] as const,
}

export const positionsQuery = queryOptions({
  queryKey: positionsKeys.list(),
  queryFn: getPositions,
})

export const memberPositionsMapQuery = queryOptions({
  queryKey: positionsKeys.memberMap(),
  queryFn: getMemberActivePositionsMap,
})
