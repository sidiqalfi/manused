export class UserManagementError extends Error {}

export function userActionError(error: unknown): string {
  if (error instanceof UserManagementError) return error.message
  const databaseError = error as {
    code?: unknown
    meta?: { driverAdapterError?: { cause?: { originalCode?: unknown } } }
  } | null | undefined
  const code = databaseError?.code
  const originalCode = databaseError?.meta?.driverAdapterError?.cause?.originalCode
  if (code === "P2002") return "Email sudah digunakan oleh akun lain."
  if (code === "P2003" || (code === "P2039" && originalCode === "23001")) return "Akun ini masih tercatat sebagai pembuat data anggota atau transaksi. Nonaktifkan akun untuk menghentikan aksesnya."
  if (code === "P2025") return "Pengguna tidak ditemukan."
  if (code === "P2034") return "Data berubah saat diproses. Muat ulang lalu coba lagi."
  console.error("User management failed:", { code })
  return "Perubahan gagal disimpan. Silakan coba lagi."
}
