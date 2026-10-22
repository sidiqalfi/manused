import { getProfile } from "./actions/get-profile"

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
}

export const profileQuery = {
  queryKey: profileKeys.me(),
  queryFn: () => getProfile(),
}
