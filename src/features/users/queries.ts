import { queryOptions } from "@tanstack/react-query"
import { getUsers } from "./actions/get-users"

export const usersKeys = { all: ["users"] as const }
export const usersQuery = queryOptions({ queryKey: usersKeys.all, queryFn: getUsers })
