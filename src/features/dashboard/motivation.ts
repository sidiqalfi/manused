// Kutipan tokoh Romawi kuno (terjemahan Indonesia) untuk dashboard,
// berganti setiap hari. Dipilih deterministik dari tanggal
// (day-of-year % panjang list), jadi stabil sepanjang hari.

const QUOTES: { text: string; author: string; source: string }[] = [
  {
    text: "Balas dendam terbaik adalah tidak menjadi seperti orang yang menyakitimu.",
    author: "Marcus Aurelius",
    source: "Meditations",
  },
  {
    text: "Kau berkuasa atas pikiranmu, bukan atas peristiwa di luar. Sadarilah itu, dan kau akan menemukan kekuatan.",
    author: "Marcus Aurelius",
    source: "Meditations",
  },
  {
    text: "Jangan habiskan sisa hidupmu berdebat tentang seperti apa orang baik itu. Jadilah salah satunya.",
    author: "Marcus Aurelius",
    source: "Meditations",
  },
  {
    text: "Jiwa diwarnai oleh warna pikirannya.",
    author: "Marcus Aurelius",
    source: "Meditations",
  },
  {
    text: "Yang menghalangi tindakan justru memajukan tindakan. Yang menghalangi jalan justru menjadi jalannya.",
    author: "Marcus Aurelius",
    source: "Meditations",
  },
  {
    text: "Kita lebih sering menderita dalam imajinasi daripada dalam kenyataan.",
    author: "Seneca",
    source: "Letters to Lucilius",
  },
  {
    text: "Bukan hidup kita yang singkat, melainkan banyak waktu yang kita sia-siakan.",
    author: "Seneca",
    source: "On the Shortness of Life",
  },
  {
    text: "Sementara kita menunggu hidup, hidup berlalu.",
    author: "Seneca",
    source: "Letters to Lucilius",
  },
  {
    text: "Keberuntungan adalah saat persiapan bertemu kesempatan.",
    author: "Seneca",
    source: "Letters to Lucilius",
  },
  {
    text: "Aku datang, aku melihat, aku menaklukkan.",
    author: "Julius Caesar",
    source: "Surat kepada Senat, 47 SM",
  },
  {
    text: "Dadu telah dilempar.",
    author: "Julius Caesar",
    source: "47 SM",
  },
  {
    text: "Percepatlah, tetapi dengan perlahan.",
    author: "Augustus",
    source: "Apophthegmata",
  },
  {
    text: "Petiklah hari ini, dan percayalah pada hari esok sesedikit mungkin.",
    author: "Horace",
    source: "Odes 1.11",
  },
  {
    text: "Yang telah memulai, telah menyelesaikan setengah pekerjaannya.",
    author: "Horace",
    source: "Epistles 1.2",
  },
  {
    text: "Keberuntungan menolong mereka yang berani.",
    author: "Virgil",
    source: "Aeneid 10.284",
  },
  {
    text: "Tetesan air menembus batu bukan karena kekuatannya, melainkan karena ketekunannya.",
    author: "Ovid",
    source: "Epistulae ex Ponto",
  },
  {
    text: "Tidak ada hari tanpa satu baris.",
    author: "Pliny the Elder",
    source: "Natural History",
  },
  {
    text: "Yang mengganggu manusia bukanlah peristiwa, melainkan pendapat mereka tentang peristiwa itu.",
    author: "Epictetus",
    source: "Enchiridion",
  },
]

export function motivationOfTheDay(now: Date = new Date()): {
  text: string
  author: string
  source: string
} {
  const start = Date.UTC(now.getUTCFullYear(), 0, 1)
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const dayOfYear = Math.floor((today - start) / 86_400_000)
  return QUOTES[dayOfYear % QUOTES.length]
}
