// URL slug untuk kegiatan: lowercase, non-alphanumeric -> '-', trim, max 40.
// Dipakai saat create (otomatis) dan edit (opsional, manual).
export function slugifyKegiatan(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}
