import Link from "next/link";

import Logo from "@/components/ui/Logo";
import StatusServer from "@/components/ui/StatusServer";
import { formatRupiah } from "@/lib/format";
import { TABS } from "@/lib/tabs";
import { BELI_KE_LUAR, URL_BELI } from "@/lib/tautan";

/**
 * Halaman depan.
 *
 * Tugasnya satu: meyakinkan pemilik warung yang membuka tautan dari WhatsApp,
 * di HP, sambil berdiri di depan warungnya. Karena itu urutannya bukan
 * "fitur dulu", melainkan:
 *
 *   1. masalah yang dia rasakan → 2. bukti hitungannya (struk, angka nyata)
 *   → 3. daftar alatnya → 4. cara pakai → 5. jawaban keberatan → 6. ajakan.
 *
 * Semua angka contoh di halaman ini konsisten satu sama lain dan ditandai
 * sebagai contoh. Tidak ada testimoni, logo klien, atau jumlah pengguna —
 * mengarang bukti sosial adalah cara tercepat kehilangan pembeli yang justru
 * paling teliti soal uang.
 */

const CONTOH = {
  menu: "Nasi Goreng Spesial",
  bahan: [
    { nama: "Beras", rincian: "150 g × Rp 12.000/kg", biaya: 1800 },
    { nama: "Ayam fillet", rincian: "80 g × Rp 38.000/kg", biaya: 3040 },
    { nama: "Telur", rincian: "1 butir × Rp 2.500", biaya: 2500 },
    { nama: "Bumbu, minyak, gas", rincian: "per porsi", biaya: 1400 },
  ],
  hargaJual: 25000,
} as const;

const BIAYA = CONTOH.bahan.reduce((jumlah, bahan) => jumlah + bahan.biaya, 0);
const UNTUNG = CONTOH.hargaJual - BIAYA;
const MARGIN = Math.round((UNTUNG / CONTOH.hargaJual) * 100);
const KOMISI_OJOL = 0.27;
const HARGA_OJOL = Math.round(CONTOH.hargaJual / (1 - KOMISI_OJOL) / 500) * 500;
const RUGI_DIAM_DIAM = Math.round(CONTOH.hargaJual * KOMISI_OJOL);

const MASALAH = [
  {
    judul: "Menu terlaris belum tentu menu paling untung",
    isi: "Yang paling sering keluar dari dapur bisa jadi yang paling tipis untungnya. Tanpa hitungan per menu, tidak ada yang tahu.",
  },
  {
    judul: "Harga ditentukan ikut warung sebelah",
    isi: "Padahal biaya bahan Anda dan biaya bahan mereka tidak pernah sama. Ikut harga orang berarti ikut untung orang — atau ikut rugi orang.",
  },
  {
    judul: "Komisi ojol memakan margin diam-diam",
    isi: `Aplikasi memotong sekitar ${Math.round(KOMISI_OJOL * 100)}%. Menu ${formatRupiah(
      CONTOH.hargaJual,
    )} yang dipasang apa adanya di ojol kehilangan ${formatRupiah(RUGI_DIAM_DIAM)} tiap porsi.`,
  },
];

const LANGKAH = [
  {
    nomor: "1",
    judul: "Tulis bahannya apa adanya",
    isi: "Satu bahan per baris, tidak perlu rapi. “Beras 150g @ Rp 12.000/kg” sudah cukup — tidak ada form panjang yang harus diisi per bahan.",
  },
  {
    nomor: "2",
    judul: "Lihat hitungannya keluar",
    isi: "Biaya asli per porsi, untung per porsi, harga yang benar untuk di tempat dan untuk ojol. Semuanya dalam Rupiah, bukan persentase kosong.",
  },
  {
    nomor: "3",
    judul: "Ambil keputusan, lalu jualan",
    isi: "Menu mana dinaikkan harganya, mana dihentikan, mana didorong — lalu caption dan gambar promosinya dibuatkan sekalian.",
  },
];

const MULAI = [
  {
    nomor: "1",
    judul: "Bayar sekali di halaman pembayaran",
    isi: "Sekali bayar untuk selamanya — bukan langganan bulanan. Halaman pembayarannya milik affiliate.id, bukan form kartu di situs ini.",
  },
  {
    nomor: "2",
    judul: "Kata sandi dikirim ke WhatsApp Anda",
    isi: "Begitu pembayaran masuk, akun warung Anda dibuat otomatis dan kata sandi awalnya dikirimkan. Tidak perlu mengisi formulir pendaftaran.",
  },
  {
    nomor: "3",
    judul: "Masuk, ganti kata sandi, langsung pakai",
    isi: "Kata sandi awal dari kami wajib diganti saat pertama kali masuk. Setelah itu kesepuluh alatnya terbuka semua.",
  },
];

const TANYA = [
  {
    tanya: "Bagaimana cara mendapatkan akunnya?",
    jawab:
      "Lewat pembayaran sekali di halaman pembayaran kami. Setelah itu akun warung Anda dibuat otomatis dan kata sandi awalnya dikirim ke WhatsApp — tidak ada formulir pendaftaran yang harus diisi sendiri. Belum ada versi gratis; yang bisa dilihat tanpa membeli adalah contoh hitungan di halaman ini, dan bentuknya sama persis dengan hasil sungguhan.",
  },
  {
    tanya: "Saya tidak paham istilah keuangan. Bisa pakai?",
    jawab:
      "Bisa. Di sini tidak ada istilah akuntan. Yang muncul di layar adalah “biaya menu”, “untung tiap porsi”, dan “harga yang disarankan” — semuanya Bahasa Indonesia, dengan angka Rupiah di sampingnya.",
  },
  {
    tanya: "Harus install aplikasi?",
    jawab:
      "Tidak. Setelah punya akun, alatnya dibuka lewat browser HP — sama seperti membuka halaman ini. Tidak ada yang perlu diunduh dari toko aplikasi.",
  },
  {
    tanya: "Data warung saya aman?",
    jawab:
      "Angka yang Anda isi dipakai untuk menghitung dan membuat konten Anda sendiri. Login memakai kata sandi pribadi, dan kata sandi awal dari kami wajib diganti saat pertama kali masuk.",
  },
  {
    tanya: "Berapa lama sampai lihat hasil pertama?",
    jawab:
      "Kurang dari satu menit setelah masuk. Semua form sudah terisi contoh nyata sejak dibuka — tekan tombol hitung dulu, lihat hasilnya, baru ganti dengan data warung Anda.",
  },
];

function Bagian({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto w-full max-w-[var(--lebar-pemasaran)] px-5 sm:px-8 ${className}`}>
      {children}
    </section>
  );
}

/**
 * Tombol ajakan utama.
 *
 * Dulu mengarah ke /alat/biaya-menu. Rute itu dijaga: pengunjung tanpa sesi
 * langsung dilempar ke /masuk, dan akun hanya terbit lewat webhook
 * affiliate.id setelah pembayaran — tidak ada pendaftaran sendiri. Jadi
 * tombol bertuliskan "gratis dicoba" selalu berakhir di form yang tidak
 * mungkin dilewati orang baru.
 *
 * Sekarang ia mengarah ke tempat yang benar-benar bisa dituju: halaman
 * pembayaran kalau alamatnya sudah diisi, kalau belum ke bagian "Cara mulai"
 * di bawah.
 */
function TombolUtama({ children }: { children: React.ReactNode }) {
  const gaya = {
    minHeight: "var(--tap-besar)",
    background: "var(--grad-cta)",
    color: "var(--on-dark)",
    borderRadius: "var(--radius-sm)",
    boxShadow: "var(--shadow-cta)",
  };
  const kelas =
    "inline-flex items-center justify-center px-7 text-base font-semibold active:translate-y-px";

  // Tautan ke luar tidak ditangani router Next; jangkar di halaman yang sama
  // tetap lewat <Link> supaya perpindahannya halus.
  return BELI_KE_LUAR ? (
    <a href={URL_BELI} className={kelas} style={gaya}>
      {children}
    </a>
  ) : (
    <Link href={URL_BELI} className={kelas} style={gaya}>
      {children}
    </Link>
  );
}

/**
 * Struk contoh di hero.
 *
 * Bukan komponen Struk milik aplikasi: di sini ia gambar diam, tidak terikat
 * lebar maksimal halaman alat, dan isinya sengaja dipadatkan supaya muat di
 * satu layar HP bersama judulnya. Bentuknya tetap sama persis dengan struk
 * hasil sungguhan — itulah janjinya: yang dilihat di sini yang akan keluar.
 */
function StrukContoh() {
  const gigi = Array.from(
    { length: 24 },
    (_, i) => `${((i + 0.5) / 24) * 100},8 ${((i + 1) / 24) * 100},0`,
  ).join(" ");

  return (
    <div
      className="w-full max-w-sm"
      style={{ filter: "drop-shadow(0 18px 40px rgb(16 30 49 / 16%))" }}
    >
      <div
        className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5"
        style={{
          background: "var(--paper)",
          borderTop: "3px solid var(--blue-800)",
          borderRadius: "var(--radius) var(--radius) 0 0",
        }}
      >
        <p className="label-kecil text-center" style={{ color: "var(--ink-soft)" }}>
          Contoh hitungan
        </p>
        {/* Sengaja <p>, bukan <h2>. Ini nama menu contoh di dalam sebuah
         * gambar peraga — memberinya pangkat judul menyamakan bobotnya
         * dengan "Sepuluh alat, dua pekerjaan" di daftar isi halaman, dan
         * pembaca layar jadi mengumumkannya sebagai bagian tersendiri. */}
        <p className="judul-kecil mt-2 text-center text-xl">{CONTOH.menu}</p>
        <div aria-hidden className="my-3.5" style={{ borderTop: "2px dotted var(--line-dotted)" }} />

        {CONTOH.bahan.map((bahan) => (
          <div key={bahan.nama} className="flex items-baseline justify-between gap-3 py-1.5">
            <div className="min-w-0">
              <p className="text-sm leading-snug">{bahan.nama}</p>
              <p className="tabular text-xs" style={{ color: "var(--ink-dim)" }}>
                {bahan.rincian}
              </p>
            </div>
            <p className="tabular shrink-0 text-sm">{formatRupiah(bahan.biaya)}</p>
          </div>
        ))}

        <div
          className="mt-4 flex items-baseline justify-between gap-3 pt-3"
          style={{ borderTop: "2px solid var(--orange)" }}
        >
          <p className="text-base font-semibold">Biaya per porsi</p>
          <p className="judul tabular text-2xl">{formatRupiah(BIAYA)}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div
            className="px-3 py-2"
            style={{ background: "var(--green-wash)", borderRadius: "var(--radius-sm)" }}
          >
            <p className="label-kecil" style={{ color: "var(--ink-dim)" }}>
              Untung / porsi
            </p>
            <p className="tabular mt-0.5 text-sm font-semibold" style={{ color: "var(--green)" }}>
              {formatRupiah(UNTUNG)}
            </p>
          </div>
          <div
            className="px-3 py-2"
            style={{ background: "var(--blue-wash)", borderRadius: "var(--radius-sm)" }}
          >
            <p className="label-kecil" style={{ color: "var(--ink-dim)" }}>
              Harga di ojol
            </p>
            <p
              className="tabular mt-0.5 text-sm font-semibold"
              style={{ color: "var(--blue-800)" }}
            >
              {formatRupiah(HARGA_OJOL)}
            </p>
          </div>
        </div>

        <p
          className="mt-3 text-center text-xs leading-relaxed"
          style={{ color: "var(--ink-dim)" }}
        >
          Dijual {formatRupiah(CONTOH.hargaJual)} di tempat · margin {MARGIN}%
        </p>
      </div>

      {/* Tepi sobek, sama seperti struk hasil di dalam aplikasi. */}
      <svg aria-hidden viewBox="0 0 100 8" preserveAspectRatio="none" className="block h-2 w-full">
        <polygon points={`0,0 ${gigi}`} fill="var(--paper)" />
      </svg>
    </div>
  );
}

export default function BerandaPage() {
  const MESIN = [
    {
      nama: "Mesin Profit",
      ringkas: "Merapikan untung dari menu yang sudah Anda punya.",
      warna: "var(--blue-600)",
      latar: "var(--blue-wash)",
      daftar: TABS.filter((tab) => tab.kelompok === "Profit"),
    },
    {
      nama: "Mesin Growth",
      ringkas: "Menambah pembeli tanpa perlu Canva atau desainer.",
      warna: "var(--orange-600)",
      latar: "var(--orange-wash)",
      daftar: TABS.filter((tab) => tab.kelompok === "Growth"),
    },
  ];

  return (
    <main>
      {/* ── Kepala halaman ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgb(245 248 252 / 88%)",
          backdropFilter: "saturate(1.6) blur(12px)",
          WebkitBackdropFilter: "saturate(1.6) blur(12px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Bagian className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2.5">
            <Logo ukuran={36} />
            <span className="flex flex-col">
              <span
                className="judul-kecil text-base leading-tight"
                style={{ color: "var(--blue-800)" }}
              >
                Digify Laris
              </span>
              <span className="text-2xs" style={{ color: "var(--ink-soft)" }}>
                Digital. Make Simple
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <StatusServer />
            </div>
            <Link
              href="/masuk"
              className="inline-flex items-center px-4 text-sm font-semibold"
              style={{
                minHeight: "var(--tap)",
                background: "var(--surface)",
                border: "1px solid var(--line-strong)",
                borderRadius: "var(--radius-sm)",
                color: "var(--ink)",
              }}
            >
              Masuk
            </Link>
          </div>
        </Bagian>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────
       * Tiga blok, bukan dua kolom.
       *
       * Di HP urutannya: judul → BUKTI → tombol. Sebelumnya struk contoh ada
       * di kolom kedua, jadi di bawah lg ia selalu jatuh setelah seluruh teks
       * dan tombol — kira-kira 780px dari puncak halaman. Artinya satu-satunya
       * elemen yang menjelaskan produk ini tanpa perlu dibaca justru tidak
       * pernah terlihat pada layar pertama.
       *
       * Di layar lebar susunannya kembali seperti semula: teks di kiri
       * (judul di atas, tombol di bawah), struk di kanan menjangkau dua baris.
       */}
      <Bagian className="pt-8 pb-14 sm:pt-14 sm:pb-20">
        <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <span
              className="inline-flex items-center rounded-[var(--radius-pill)] px-3 py-1.5"
              style={{ background: "var(--orange-wash)", color: "var(--orange-600)" }}
            >
              <span className="label-kecil">Untuk warung, kedai &amp; kafe</span>
            </span>

            {/* Judulnya menyebut pekerjaannya, bukan bertanya.
             *
             * Sebelumnya h1 berbunyi "Menu mana yang benar-benar menghasilkan
             * uang?" — kail yang bagus, tapi orang yang baru mendarat butuh
             * tahu ini ALAT APA sebelum ia mau menjawab pertanyaan apa pun.
             * Pertanyaannya tidak dibuang, hanya turun jadi kalimat pertama
             * paragraf, tempat ia memang berfungsi.
             *
             * 28px di HP, bukan 34px: pada 360px ukuran itu membuat judul
             * jadi lima baris dan mendorong bukti serta tombol keluar layar. */}
            <h1 className="judul mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Hitung untung asli tiap menu,{" "}
              <span style={{ color: "var(--blue-600)" }}>lalu buat konten promosinya</span>
            </h1>

            <p
              className="teks-rapi mt-4 max-w-xl text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--ink-dim)" }}
            >
              Menu paling laris belum tentu menu paling untung. Digify Laris menghitung biaya
              bahan tiap porsi, menentukan harga yang benar termasuk untuk ojol, lalu
              menuliskan promosinya. Semua Bahasa Indonesia, cukup dari HP.
            </p>
          </div>

          <div className="flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-end lg:self-center">
            <StrukContoh />
          </div>

          <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
            <div className="flex flex-col gap-3 sm:flex-row">
              <TombolUtama>Ambil akses warung Anda</TombolUtama>
              <Link
                href="#alat"
                className="inline-flex items-center justify-center px-7 text-base font-semibold"
                style={{
                  minHeight: "var(--tap-besar)",
                  background: "var(--surface)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--ink)",
                }}
              >
                Lihat 10 alatnya
              </Link>
            </div>

            <ul
              className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm"
              style={{ color: "var(--ink-dim)" }}
            >
              {[
                "Bayar sekali, dipakai selamanya",
                "Tanpa install aplikasi",
                "Form sudah terisi contoh",
              ].map((janji) => (
                <li key={janji} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold"
                    style={{ background: "var(--green-wash)", color: "var(--green)" }}
                  >
                    ✓
                  </span>
                  {janji}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Bagian>

      {/* ── Masalah ────────────────────────────────────────────────────── */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
        <Bagian className="py-14 sm:py-20">
          <p className="label-kecil" style={{ color: "var(--orange-600)" }}>
            Yang biasanya terjadi
          </p>
          <h2 className="judul mt-3 max-w-2xl text-3xl sm:text-4xl">
            Omzet naik, tapi uangnya tetap tidak terasa
          </h2>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {MASALAH.map((masalah, indeks) => (
              <article
                key={masalah.judul}
                className="p-6"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <span
                  aria-hidden
                  className="judul tabular block text-3xl"
                  style={{ color: "var(--line-strong)" }}
                >
                  0{indeks + 1}
                </span>
                <h3 className="judul-kecil mt-3 text-lg">{masalah.judul}</h3>
                <p
                  className="teks-rapi mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--ink-dim)" }}
                >
                  {masalah.isi}
                </p>
              </article>
            ))}
          </div>
        </Bagian>
      </div>

      {/* ── Dua mesin ──────────────────────────────────────────────────── */}
      <Bagian className="py-14 sm:py-20">
        <div id="alat" className="scroll-mt-28">
          <p className="label-kecil" style={{ color: "var(--blue-600)" }}>
            Isi paketnya
          </p>
          <h2 className="judul mt-3 max-w-2xl text-3xl sm:text-4xl">
            Sepuluh alat, dua pekerjaan
          </h2>
          <p
            className="teks-rapi mt-3 max-w-2xl text-base leading-relaxed"
            style={{ color: "var(--ink-dim)" }}
          >
            Enam alat pertama merapikan untung Anda. Empat sisanya membawa pembeli baru.
            Urutannya sengaja: mempromosikan menu yang marginnya bocor hanya membuat ruginya
            datang lebih cepat.
          </p>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {MESIN.map((mesin) => (
            <div
              key={mesin.nama}
              className="p-6 sm:p-7"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span
                className="inline-flex rounded-[var(--radius-pill)] px-3 py-1.5"
                style={{ background: mesin.latar, color: mesin.warna }}
              >
                <span className="label-kecil">{mesin.nama}</span>
              </span>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                {mesin.ringkas}
              </p>

              <ul className="mt-5 flex flex-col">
                {mesin.daftar.map((tab) => (
                  <li
                    key={tab.slug}
                    className="flex gap-3 border-t py-3.5"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span
                      aria-hidden
                      className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-xs font-semibold"
                      style={{ background: mesin.latar, color: mesin.warna }}
                    >
                      {tab.nomor}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{tab.judul}</p>
                      <p
                        className="teks-rapi mt-0.5 text-xs leading-relaxed"
                        style={{ color: "var(--ink-dim)" }}
                      >
                        {tab.ringkas}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Bagian>

      {/* ── Cara pakai ─────────────────────────────────────────────────── */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
        <Bagian className="py-14 sm:py-20">
          <p className="label-kecil" style={{ color: "var(--blue-600)" }}>
            Cara pakai
          </p>
          <h2 className="judul mt-3 text-3xl sm:text-4xl">Tiga langkah, sekali duduk</h2>

          <ol className="mt-9 grid gap-4 sm:grid-cols-3">
            {LANGKAH.map((langkah) => (
              <li
                key={langkah.nomor}
                className="p-6"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <span
                  aria-hidden
                  className="judul tabular flex h-10 w-10 items-center justify-center text-lg"
                  style={{
                    background: "var(--grad-panel)",
                    color: "var(--on-dark)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {langkah.nomor}
                </span>
                <h3 className="judul-kecil mt-4 text-lg">{langkah.judul}</h3>
                <p
                  className="teks-rapi mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--ink-dim)" }}
                >
                  {langkah.isi}
                </p>
              </li>
            ))}
          </ol>
        </Bagian>
      </div>

      {/* ── Cara mulai ───────────────────────────────────────────────────
       * Sasaran jangkar tombol ajakan selama NEXT_PUBLIC_URL_BELI belum
       * diisi. Isinya jalur yang sebenarnya (PRD §8.1): bayar → kredensial
       * dikirim → masuk. Sebelumnya jalur ini tidak diterangkan di mana pun,
       * jadi pengunjung menekan tombol dan mendarat di form masuk tanpa tahu
       * kata sandinya harus datang dari mana. */}
      <Bagian className="pb-14 sm:pb-20">
        <div
          id="cara-mulai"
          className="scroll-mt-24 px-6 py-10 sm:px-10 sm:py-12"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p className="label-kecil" style={{ color: "var(--orange-600)" }}>
            Cara mulai
          </p>
          <h2 className="judul mt-3 max-w-2xl text-3xl sm:text-4xl">
            Dari bayar sampai bisa dipakai, tiga langkah
          </h2>
          <p
            className="teks-rapi mt-3 max-w-2xl text-base leading-relaxed"
            style={{ color: "var(--ink-dim)" }}
          >
            Akunnya dibuatkan, bukan didaftarkan sendiri. Tidak ada formulir panjang dan tidak
            ada masa percobaan yang diam-diam berubah jadi tagihan.
          </p>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {MULAI.map((langkah) => (
              <li key={langkah.nomor} className="flex gap-3.5">
                <span
                  aria-hidden
                  className="tabular flex h-8 w-8 shrink-0 items-center justify-center text-sm font-semibold"
                  style={{
                    background: "var(--orange-wash)",
                    color: "var(--orange-600)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {langkah.nomor}
                </span>
                <div className="min-w-0">
                  <h3 className="judul-kecil text-base">{langkah.judul}</h3>
                  <p
                    className="teks-rapi mt-1.5 text-sm leading-relaxed"
                    style={{ color: "var(--ink-dim)" }}
                  >
                    {langkah.isi}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-8 text-sm" style={{ color: "var(--ink-dim)" }}>
            Kata sandinya sudah diterima?{" "}
            <Link href="/masuk" className="font-semibold" style={{ color: "var(--blue-600)" }}>
              Masuk ke akun Anda
            </Link>
          </p>
        </div>
      </Bagian>

      {/* ── Pertanyaan ─────────────────────────────────────────────────── */}
      <Bagian className="pb-14 sm:pb-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="label-kecil" style={{ color: "var(--blue-600)" }}>
              Sebelum memutuskan
            </p>
            <h2 className="judul mt-3 text-3xl sm:text-4xl">
              Pertanyaan yang paling sering masuk
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {TANYA.map((item) => (
              // <details> dipakai supaya tetap bisa dibuka tanpa JavaScript —
              // di koneksi lambat halaman ini sering sudah terbaca sebelum
              // skripnya selesai diunduh.
              <details
                key={item.tanya}
                className="group px-5 py-4"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold">
                  {item.tanya}
                  <span
                    aria-hidden
                    className="shrink-0 text-lg transition-transform group-open:rotate-45"
                    style={{ color: "var(--blue-600)" }}
                  >
                    +
                  </span>
                </summary>
                <p
                  className="teks-rapi mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--ink-dim)" }}
                >
                  {item.jawab}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Bagian>

      {/* ── Ajakan penutup ─────────────────────────────────────────────── */}
      <Bagian className="pb-14 sm:pb-20">
        <div
          className="px-6 py-12 text-center sm:px-12 sm:py-16"
          style={{ background: "var(--grad-panel)", borderRadius: "var(--radius-xl)" }}
        >
          <h2
            className="judul mx-auto max-w-2xl text-3xl sm:text-4xl"
            style={{ color: "var(--on-dark)" }}
          >
            Bayar sekali. Sepuluh alatnya jadi milik warung Anda.
          </h2>
          <p
            className="teks-rapi mx-auto mt-4 max-w-xl text-base leading-relaxed"
            style={{ color: "var(--on-dark-dim)" }}
          >
            Tidak ada langganan bulanan dan tidak ada biaya tambahan per hitungan. Semua form
            sudah terisi contoh nyata, jadi menu pertama Anda selesai dihitung di menit pertama.
          </p>
          <div className="mt-8 flex justify-center">
            <TombolUtama>Ambil akses warung Anda</TombolUtama>
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--on-dark-dim)" }}>
            Sudah pernah membeli?{" "}
            <Link href="/masuk" className="font-semibold underline underline-offset-2">
              Masuk ke akun Anda
            </Link>
          </p>
        </div>
      </Bagian>

      {/* ── Kaki halaman ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--line)" }}>
        <Bagian className="flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Logo ukuran={30} />
            <span className="text-sm" style={{ color: "var(--ink-dim)" }}>
              Digify.ID · Digital. Make Simple
            </span>
          </div>
          <div className="flex items-center gap-4">
            <StatusServer />
            <Link
              href="/masuk"
              className="text-sm font-semibold"
              style={{ color: "var(--blue-600)" }}
            >
              Masuk ke akun
            </Link>
          </div>
        </Bagian>
      </footer>
    </main>
  );
}
