import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "user" | "guest"
    } & DefaultSession["user"]
  }

  interface User {
    role?: "user" | "guest"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: "user" | "guest"
  }
}
