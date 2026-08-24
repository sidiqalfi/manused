export function formatCurrency(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
