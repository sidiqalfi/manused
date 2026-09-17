import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { logActivity } from "@/features/log/activity-log"

const GUEST_ID = "00000000-0000-0000-0000-000000000000"
const GUEST_USER = {
  id: GUEST_ID,
  email: "guest@manused.local",
  name: "Tamu",
  role: "guest" as const,
}

async function recordAuthLog(input: {
  actor: { id: string | null; name: string | null; email: string | null }
  action: "LOGIN" | "LOGIN_FAILED"
}) {
  await logActivity(prisma, {
    actor: input.actor,
    action: input.action,
    entity: "auth",
    summary:
      input.action === "LOGIN"
        ? "Masuk ke aplikasi"
        : "Percobaan masuk gagal",
  })
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {
          type: "email",
          label: "Email",
          placeholder: "johndoe@gmail.com",
        },
        password: {
          type: "password",
          label: "Password",
          placeholder: "*****",
        },
      },
      async authorize(credentials) {
        const email = credentials.email as string
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          await recordAuthLog({
            actor: { id: null, name: null, email },
            action: "LOGIN_FAILED",
          })
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password)

        if (!isPasswordValid) {
          await recordAuthLog({
            actor: { id: user.id, name: user.name ?? null, email },
            action: "LOGIN_FAILED",
          })
          return null
        }

        await recordAuthLog({
          actor: { id: user.id, name: user.name ?? null, email },
          action: "LOGIN",
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
        }
      },
    }),
    Credentials({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        await recordAuthLog({
          actor: { id: GUEST_ID, name: GUEST_USER.name, email: GUEST_USER.email },
          action: "LOGIN",
        })
        return GUEST_USER
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 jam dalam detik (86400)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role ?? "user"
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.email = token.email as string
      session.user.name = (token.name ?? null) as string
      session.user.role = (token.role ?? "user") as "user" | "guest"
      return session
    },
  },
})