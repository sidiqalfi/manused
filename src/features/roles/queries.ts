import { queryOptions } from "@tanstack/react-query"
import { getRoles } from "./actions/get-roles"
import { getMemberActiveRolesMap } from "./actions/get-member-active-roles-map"

export const rolesKeys = {
  all: ["roles"] as const,
  list: () => [...rolesKeys.all, "list"] as const,
  memberMap: () => [...rolesKeys.all, "memberMap"] as const,
}

export const rolesQuery = queryOptions({
  queryKey: rolesKeys.list(),
  queryFn: getRoles,
})

export const memberRolesMapQuery = queryOptions({
  queryKey: rolesKeys.memberMap(),
  queryFn: getMemberActiveRolesMap,
})
