import Link from "next/link";

import StatusServer from "@/components/ui/StatusServer";

const MANFAAT = [
  {
    judul: "Tahu menu mana yang benar-benar untung",
    isi: "Menu paling ramai belum tentu menu paling menguntungkan. Kami hitungkan profit tiap menu per minggu.",
  },
  {
    judul: "Harga ojol dihitung terpisah",
    isi: "Komisi aplikasi bisa 27%. Kalau harga dine-in dipakai apa adanya di ojol, margin Anda habis diam-diam.",
  },
  {
    judul: "Konten promosi langsung jadi",
    isi: "Caption, hashtag, sampai gambar carousel siap posting. Tidak perlu Canva, tidak perlu desainer.",
  },
];

export default function BerandaPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className="text-sm font-semibold tracking-wide"
            style={{ color: "var(--blue)" }}
          >
            Digify.ID · AI Tools
          </p>
          <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
            Digital. Make Simple
          </p>
        </div>
        <StatusServer />
      </header>

      <section className="mt-12 sm:mt-16">
        <h1
          className="text-4xl leading-tight font-bold sm:text-6xl"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}
        >
          Menu mana yang benar-benar{" "}
          <span style={{ color: "var(--blue)" }}>menghasilkan uang?</span>
        </h1>
        <p
          className="mt-5 max-w-2xl text-lg leading-relaxed"
          style={{ color: "var(--ink-dim)" }}
        >
          Digify Laris menghitung biaya asli tiap menu warung Anda, menentukan harga yang
          benar termasuk untuk ojol, lalu membuatkan konten promosinya. Semua dalam Bahasa
          Indonesia, bisa dipakai dari HP.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/alat/biaya-menu"
            className="inline-flex items-center justify-center rounded-[var(--radius)] px-7 text-base font-semibold text-white transition-colors"
            style={{ background: "var(--orange)", minHeight: "var(--tap)" }}
          >
            Coba sekarang, gratis dicoba
          </Link>
          <Link
            href="/masuk"
            className="inline-flex items-center justify-center rounded-[var(--radius)] border px-7 text-base font-semibold transition-colors"
            style={{
              borderColor: "var(--line)",
              background: "var(--surface)",
              color: "var(--ink)",
              minHeight: "var(--tap)",
            }}
          >
            Saya sudah punya akun
          </Link>
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--ink-dim)" }}>
          Setiap form sudah terisi contoh nyata. Klik hitung dulu, baru ganti dengan data
          warung Anda.
        </p>
      </section>

      <section className="mt-14 grid gap-4 sm:mt-20 sm:grid-cols-3">
        {MANFAAT.map((manfaat) => (
          <article
            key={manfaat.judul}
            className="rounded-[var(--radius-lg)] p-6"
            style={{
              background: "var(--surface)",
              boxShadow: "var(--shadow-sm)",
              border: "1px solid var(--line)",
            }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {manfaat.judul}
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
              {manfaat.isi}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
