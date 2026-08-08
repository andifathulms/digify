import { cariTab, NAMA_KELOMPOK, TABS } from "@/lib/tabs";

/**
 * Judul dan satu kalimat penjelas di atas tiap alat.
 *
 * Ditambah penanda kemajuan. "Alat 3 dari 10" saja tidak memberi tahu sudah
 * sejauh mana, apalagi karena alat 1–6 dan 7–10 adalah dua alur berbeda:
 * yang satu menghitung uang, yang satu membuat konten. Garisnya diwarnai per
 * kelompok — biru untuk profit, oranye untuk pertumbuhan — supaya user tahu
 * sedang berada di alur yang mana.
 */
export default function JudulTab({ slug }: { slug: string }) {
  const tab = cariTab(slug);
  if (!tab) return null;

  const seKelompok = TABS.filter((lain) => lain.kelompok === tab.kelompok);
  const urutan = seKelompok.findIndex((lain) => lain.slug === tab.slug) + 1;
  const warnaKelompok = tab.kelompok === "Profit" ? "var(--blue-500)" : "var(--orange-600)";
  const namaKelompok = NAMA_KELOMPOK[tab.kelompok];

  return (
    <header>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1"
          style={{
            background: tab.kelompok === "Profit" ? "var(--blue-wash)" : "var(--orange-wash)",
            color: warnaKelompok,
          }}
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: warnaKelompok }}
          />
          <span className="label-kecil">{namaKelompok}</span>
        </span>
        <span className="label-kecil" style={{ color: "var(--ink-soft)" }}>
          Langkah {urutan} dari {seKelompok.length}
        </span>
      </div>

      <h1 className="judul mt-3 text-3xl sm:text-4xl">{tab.judul}</h1>

      <p
        className="teks-rapi mt-2.5 max-w-prose text-sm leading-relaxed"
        style={{ color: "var(--ink-dim)" }}
      >
        {tab.ringkas}
      </p>

      {/* Garis kemajuan. aria-hidden: angkanya sudah dibacakan di atas, jadi
       * mengulanginya sebagai progressbar hanya menambah kebisingan. */}
      <div
        aria-hidden
        className="mt-4 h-1 w-full overflow-hidden rounded-full"
        style={{ background: "var(--line)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${(urutan / seKelompok.length) * 100}%`,
            background: warnaKelompok,
            transition: "width var(--dur-lambat) var(--ease)",
          }}
        />
      </div>
    </header>
  );
}
