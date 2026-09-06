import { queryOptions } from "@tanstack/react-query"
import { getActivityLogs } from "./actions/get-activity-logs"
import { getActivityLogActors } from "./actions/get-activity-actors"

export const logKeys = {
  all: ["log"] as const,
  list: (input: Parameters<typeof getActivityLogs>[0]) =>
    [...logKeys.all, "list", input] as const,
  actors: () => [...logKeys.all, "actors"] as const,
}

export function activityLogsQuery(input: Parameters<typeof getActivityLogs>[0]) {
  return queryOptions({
    queryKey: logKeys.list(input),
    queryFn: () => getActivityLogs(input),
  })
}

export const activityLogActorsQuery = queryOptions({
  queryKey: logKeys.actors(),
  queryFn: getActivityLogActors,
})
