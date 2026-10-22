import { createHash } from "crypto"

/**
 * URL avatar Gravatar untuk sebuah email.
 * Gravatar menerima hash SHA-256 (standar baru) atau MD5 (lama);
 * SHA-256 dipakai di sini. Email di-trim dan di-lowercase sesuai
 * aturan Gravatar.
 *
 * Parameter `d=404` membuat Gravatar mengembalikan 404 jika email
 * tidak terdaftar, sehingga <AvatarImage> gagal load dan
 * <AvatarFallback> yang muncul (inisial nama).
 */
export function gravatarUrl(email: string, size = 128): string {
  const normalized = email.trim().toLowerCase()
  const hash = createHash("sha256").update(normalized).digest("hex")
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
}
