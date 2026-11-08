export class UserManagementError extends Error {}

export function userActionError(error: unknown): string {
  if (error instanceof UserManagementError) return error.message
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined
  if (code === "P2002") return "Email sudah digunakan oleh akun lain."
  if (code === "P2025") return "Pengguna tidak ditemukan."
  if (code === "P2034") return "Data berubah saat diproses. Muat ulang lalu coba lagi."
  console.error("User management failed:", { code })
  return "Perubahan gagal disimpan. Silakan coba lagi."
}
