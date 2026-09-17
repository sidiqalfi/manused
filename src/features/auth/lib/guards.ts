export function isGuestSession(
  session: { user?: unknown } | null | undefined
): boolean {
  const user = session?.user as { role?: unknown } | null | undefined
  return user?.role === "guest"
}

export const GUEST_WRITE_ERROR = "Tamu hanya dapat melihat data."
