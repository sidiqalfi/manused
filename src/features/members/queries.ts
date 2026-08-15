import { queryOptions } from "@tanstack/react-query"
import { getMembers } from "./actions/get-members"

export const membersKeys = {
  all: ["members"] as const,
}

export const membersQuery = queryOptions({
  queryKey: membersKeys.all,
  queryFn: getMembers,
})
