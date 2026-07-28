# DECISIONS

Catatan keputusan teknis (ADR ringan). Format: tanggal · keputusan · alasan · yang ditolak.
Ditulis supaya Owner (non-IT) dan developer berikutnya bisa mengerti kenapa sesuatu dibuat begini.

---

## 2026-07-28 · Tab 1–6 (Profit Engine) tidak lagi memakai AI sama sekali

**Keputusan.** Seluruh Profit Engine dihitung oleh aturan di dalam kode kita sendiri.
Hanya Tab 7–9 (Growth Engine) yang memanggil Gemini.

| Tab | Sekarang | Kenapa |
|---|---|---|
| 1 Biaya Menu | Aturan | Parser bahan + tabel konversi satuan |
| 2 Harga Jual | Aturan | Seluruh keluarannya punya rumus pasti |
| 3 Ranking | Aturan | Ambang margin + kalimat aksi berisi angka hitungan |
| 4 Optimasi Menu | Aturan | Matriks menu engineering (Kasavana–Smith), metode baku |
| 5 Laporan Final | Aturan | Kolomnya memang sudah hitungan; catatan tinggal fakta |
| 6 Waste Tracker | Aturan | Tabel kategori bahan |
| 7 Ide Menu | **AI** | Butuh mengarang menu baru — tidak ada rumusnya |
| 8 Konten Promosi | **AI** | Caption template membuat semua pelanggan seragam di publik |
| 9/10 Carousel | **AI** | Sama seperti Tab 8. Render gambarnya sendiri tanpa AI |

**Alasan.**
1. **Angka uang harus bisa diulang.** Pemilik warung memakai angka ini untuk
   menentukan harga. Hasil yang berbeda tiap kali dihitung ulang membuat dia berhenti
   percaya — dan konsistensi persis itu yang tidak bisa dijamin model bahasa.
2. **Bisa dijelaskan.** Kalau dia bertanya "kenapa menu ini disuruh dihentikan?",
   jawabannya bisa ditunjuk angkanya, bukan "karena AI bilang".
3. **Biaya.** Panggilan AI turun sekitar 60–70%. Ini langsung mengecilkan risiko utama
   di `PRD.md` §12: bayar sekali seumur hidup, tapi tagihan AI jalan terus.
4. **Tetap hidup tanpa kunci API.** Profit Engine berfungsi penuh walau
   `GEMINI_API_KEY` kosong.

**Yang berubah dari kontrak.** Tidak ada. Path dan nama field sama persis; yang
berubah cuma dari mana angkanya berasal. Test kontrak tetap menguji kesembilan
endpoint, ditambah test yang memastikan Tab 1–6 tetap 200 saat kunci API dikosongkan.

**Yang hilang.** Keragaman kalimat. Aksi dan rekomendasi sekarang template berisi
angka hitungan — tetap spesifik dan bisa dikerjakan, tapi dua warung dengan angka
mirip akan membaca kalimat yang mirip. Untuk Tab 1–6 itu pertukaran yang sepadan;
untuk Tab 8–9 tidak, karena hasilnya diposting ke publik.

**Konsekuensi lain.** Endpoint aturan tidak memotong kuota harian. Kuota ada untuk
menahan biaya AI; memotongnya untuk hitungan yang gratis sama saja menghukum user
tanpa alasan. `views/base.py` memisahkannya lewat `EndpointAturan` vs `EndpointAI`,
dan ada test yang membaca flag itu langsung dari view supaya daftarnya tidak bisa
melenceng diam-diam.

**Ditolak.** Melatih/menjalankan model sendiri (VPS ber-GPU ratusan dolar sebulan,
biaya tetap yang justru lebih buruk untuk model lifetime, dan Bahasa Indonesianya
lebih kaku); membuang AI sepenuhnya termasuk Tab 7–9 (Growth Engine adalah setengah
janji produknya, `PRD.md` §1).

---

## 2026-07-28 · Daftar bahan Tab 1 dibaca apa adanya sebagai takaran satu porsi

**Keputusan.** Parser menjumlahkan bahan persis seperti yang ditulis. Tidak ada
penskalaan diam-diam terhadap `portionWeight`.

**Alasan.** Menskalakan otomatis butuh menebak total berat resep — mustahil dilakukan
benar kalau ada "2 butir telur" dan bahan cair. Lebih penting lagi: hasilnya jadi
tidak bisa dihitung ulang pemilik warung dengan kalkulator di tangannya. Angka biaya
yang tidak bisa dia buktikan sendiri tidak akan dia pakai untuk menentukan harga.

**Konsekuensinya.** Pengguna harus menulis takaran per porsi. Contoh prefill sudah
diperbaiki jadi per porsi (Beras 150g, bukan 500g), dan teks bantuan di formnya
menyebutkan itu.

**Ditolak.** Menskalakan dengan `portionWeight / total berat bahan` (silent, tidak
bisa diverifikasi user, dan salah untuk bahan cair maupun bahan hitungan).

**Terbuka untuk Owner.** Kalau ternyata pembeli lebih sering menulis takaran sepanci,
tambahkan isian "resep ini untuk berapa porsi" — tapi itu mengubah kontrak input,
jadi butuh keputusan Owner lebih dulu.

---

## 2026-07-28 · Prompt Gemini ditulis ulang dari spesifikasi, bukan disalin dari Express

**Keputusan.** Prompt untuk 9 endpoint ditulis berdasarkan `PRD.md` Bagian 5 dan
`docs/API_CONTRACT.md`, bukan disalin verbatim dari `routes/*.js` versi Express.

**Alasan.** Source code Express tidak ada di repo ini — hanya tiga dokumen
(`CLAUDE.md`, `PRD.md`, `API_CONTRACT.md`). Menyalin verbatim tidak mungkin dilakukan.

**Konsekuensi & tindak lanjut (WAJIB sebelum produksi).** `CLAUDE.md` §3.6 dan
`PRD.md` §12 menandai perbedaan prompt sebagai risiko regresi. Setiap file di
`backend/apps/optimizer/prompts/` diberi header `# TODO(port): bandingkan dengan routes/<nama>.js`.
Saat repo Express tersedia, ganti isi konstanta prompt dengan teks asli — struktur
kode tidak perlu berubah, hanya string-nya.

**Ditolak.** Menebak-nebak prompt lalu diam saja: risiko output berubah karakter
tanpa ada yang tahu.

---

## 2026-07-28 · `GEMINI_MODEL` default `gemini-2.5-flash`

**Keputusan.** Nilai default env `GEMINI_MODEL` diisi `gemini-2.5-flash`.

**Alasan.** Nama model tidak boleh hardcode (`CLAUDE.md` §6). Nilai persis dari `.env`
Express belum diverifikasi (`PRD.md` §12 menandainya sebagai risiko), jadi dipilih
model cepat + murah yang mendukung structured output, dan nilainya bisa diganti tanpa
menyentuh kode.

**Ditolak.** Membiarkan env kosong sampai diverifikasi — bikin `docker compose up`
gagal di mesin baru.

---

## 2026-07-28 · Structured output lewat `response_json_schema`, bukan parsing teks

**Keputusan.** Setiap panggilan Gemini mengirim JSON Schema eksplisit
(`apps/ai/schemas/`) dan membaca `response.text` sebagai JSON.

**Alasan.** `API_CONTRACT.md` menjamin bentuk respons lewat schema, bukan lewat parsing.
Tidak ada regex atas output model.

**Ditolak.** Free-text + regex — rapuh, dan bentuk respons jadi tidak bisa dites.

---

## 2026-07-28 · Berkas font disertakan di repo, bukan diambil dari Google Fonts saat build

**Keputusan.** Font disimpan di `frontend/src/fonts/` dan dimuat lewat `next/font/local`,
bukan `next/font/google`.

**Alasan.** `next/font/google` mengunduh berkas font pada saat `npm run build`, bukan
saat aplikasi berjalan. Artinya **deploy bergantung pada layanan pihak ketiga**: kalau
Google sedang tidak terjangkau, atau VPS-nya di balik jaringan yang membatasi, build
GAGAL dan aplikasi tidak bisa naik sama sekali.

Ini bukan kekhawatiran teoretis — build produksi di sini benar-benar gagal dengan
`Failed to fetch 'IBM Plex Mono' from Google Fonts` sebelum diganti.

**Isinya.** Subset latin saja (Bahasa Indonesia tidak butuh yang lain). Fraunces dan
Plus Jakarta Sans berupa font variabel — satu berkas untuk seluruh rentang berat.
Totalnya di bawah 130 KB.

**Terverifikasi.** `docker build --target prod` berhasil tanpa akses jaringan sama
sekali, dan PNG carousel tetap keluar dengan font yang benar.

**Ditolak.** `next/font/google` (deploy bisa gagal karena sebab di luar kendali kita);
memuat font lewat `<link>` ke Google saat runtime (menambah permintaan ke domain lain
di HP dengan koneksi lambat, dan bikin teks berkedip).

---

## 2026-07-28 · Kuota harian disimpan di Postgres, throttle burst di Redis

**Keputusan.** `DailyQuota` (Postgres) adalah sumber kebenaran kuota harian.
Redis hanya dipakai `ScopedRateThrottle` DRF untuk menahan klik ganda.

**Alasan.** `PRD.md` §0.e. Redis boleh hilang tanpa membuat kuota lifetime jebol.

**Ditolak.** Kuota murni di Redis — restart Redis = kuota semua user ter-reset.

---

## 2026-07-28 · `html2canvas-pro` untuk render slide carousel

**Keputusan.** Dependency baru `html2canvas-pro` ditambahkan ke `frontend/package.json`.

**Alasan.** `CLAUDE.md` §9.1: `html2canvas` versi asli tidak bisa mem-parse `oklch()`
yang dipakai Tailwind v4, hasilnya PNG hitam. `html2canvas-pro` mendukung `oklch`.
Sebagai lapis pengaman kedua, komponen slide juga memakai hex literal, bukan token Tailwind.

**Ditolak.** `html2canvas` asli (PNG rusak), `dom-to-image` (tidak terawat),
render server-side pakai Puppeteer (butuh container Chrome — berat, mahal di VPS kecil).

---

## 2026-07-28 · PNG carousel diunduh pada ukuran 1080×1350, bukan 5400×6750

**Keputusan.** `SKALA_TANGKAP = 1` di `frontend/src/components/carousel/unduh.ts`.
Node slide tetap dirender pada ukuran asli 1080×1350, lalu di-capture apa adanya.

**Alasan.** Ada pertentangan antar dokumen:
- `CLAUDE.md` §9.3 meminta node berukuran asli 1080×1350 **lalu** di-capture dengan
  `scale: 5`. Digabung, hasilnya PNG 5400×6750.
- `PRD.md` §9 Fase 3 menetapkan kriteria selesai: "PNG hasil download **benar-benar
  1080×1350**".

Kriteria PRD yang dipakai, karena itu yang bisa diuji dan itu ukuran yang memang
diminta Instagram. Node tetap dirender berukuran penuh sesuai CLAUDE.md, jadi teksnya
tetap tajam tanpa perlu pembesaran. PNG 5400px berukuran beberapa megabita — berat
diunduh dan dibagikan dari HP di koneksi lambat, padahal itu justru profil pengguna
kita (`PRD.md` §2).

**Terverifikasi.** Chromium sungguhan pada viewport 360px: PNG keluar 1080×1350,
~76 KB, warna sesuai Gaya C, dan slide penutup benar-benar biru penuh.

**Ditolak.** `scale: 5` apa adanya (PNG raksasa, melanggar kriteria PRD); mengecilkan
node sumber jadi 216×270 lalu `scale: 5` (teks jadi buram karena dirender pada ukuran
kecil, melanggar CLAUDE.md §9.3).

**Kalau Owner berubah pikiran:** ubah satu angka `SKALA_TANGKAP`.

---

## 2026-07-28 · Slide carousel dirender dua kali: satu untuk pratinjau, satu untuk capture

**Keputusan.** `PapanCarousel` merender tiap slide dua kali — satu di dalam kotak
pratinjau yang dikecilkan dengan `transform: scale()`, satu lagi di luar layar
(`position: fixed; left: -20000px`) pada ukuran asli. Yang di-capture selalu yang
di luar layar.

**Alasan.** html2canvas memakai posisi dan ukuran hasil layout, jadi
`transform: scale()` pada elemen mana pun **di atas** node yang di-capture ikut
terhitung: isinya mengecil ke sudut kiri atas dan sisa kanvas jadi polos.

Yang berbahaya: pada slide berlatar putih cacat ini **tidak kelihatan sama sekali** —
PNG-nya tetap 1080×1350 dan tetap putih. Ini baru ketahuan setelah slide penutup yang
berlatar biru ikut diuji dan keluar 92% putih.

**Ditolak.** Menaruh transform hanya di pembungkus terluar (sudah dicoba — leluhur
ber-transform tetap terhitung); menghapus pratinjau (user perlu melihat slidenya
sebelum mengunduh).

---

## 2026-07-28 · Token JWT disimpan di cookie httpOnly, di-set oleh Route Handler Next.js

**Keputusan.** Django mengeluarkan access/refresh token; Route Handler `/api/auth/*`
di Next.js yang menaruhnya sebagai cookie httpOnly.

**Alasan.** `PRD.md` §8.2. localStorage bisa dibaca skrip pihak ketiga (XSS).

**Ditolak.** Token di localStorage; Clerk (biaya bulanan, tidak butuh social login).

---

## 2026-07-28 · SELURUH `/api/*` diteruskan lewat Next.js, bukan hanya `/api/auth/*`

**Keputusan.** Browser tidak pernah memanggil Django langsung. Semua permintaan
menuju origin frontend sendiri (`/api/...`), lalu diteruskan oleh
`frontend/src/app/api/[...jalur]/route.ts` sambil memasang header `Authorization`
dari cookie.

**Alasan.** `PRD.md` §8.2 merencanakan Route Handler tipis "hanya untuk `/api/auth/*`".
Rencana itu tidak bisa jalan bersama cookie httpOnly: tokennya milik origin
**frontend**, dan browser memang tidak boleh membacanya — jadi browser juga tidak
bisa memasang header `Authorization` sendiri saat memanggil Django. Yang bisa
membacanya hanya sisi server Next.js.

**Untungnya justru bertambah:**
- Browser tidak pernah tahu alamat Django. Tidak ada `NEXT_PUBLIC_*` berisi apa pun
  yang sensitif.
- CORS tidak dibutuhkan sama sekali, di dev maupun produksi — dev dan prod jadi
  berperilaku sama, dan jebakan di `CLAUDE.md` §9.7 hilang dengan sendirinya.
- Access token yang kedaluwarsa (umurnya 15 menit) disegarkan diam-diam di server.
  Tanpa itu, user yang mengisi form panjang akan ditendang keluar tepat saat menekan
  tombol hitung, dan isian formnya hilang.

**Biayanya.** Satu lompatan jaringan tambahan di dalam jaringan Docker (hitungan
milidetik, sementara panggilan AI-nya sendiri 10–30 detik), dan timeout perlu diset
di dua tempat: 120 detik di penerus, 90 detik di klien browser.

**Ditolak.** Token di localStorage supaya browser bisa memanggil Django langsung
(melanggar PRD §8.2); Django membaca JWT dari cookie (di dev, frontend :3000 dan
backend :8000 beda origin — cookienya tidak akan pernah terkirim).

**Terverifikasi.** Chromium sungguhan: cookie `digify_akses` ber-`httpOnly=true` dan
`document.cookie` kosong dari sisi JavaScript.

---

## 2026-07-28 · Sistem desain diperluas, bukan diganti: tangga warna, bukan lima hex

**Keputusan.** Palet brand di `PRD.md` §4 tetap dipakai apa adanya sebagai warna
inti — biru `#0F4C97`/`#1868C7`/`#2E9BF0`, oranye `#F2790C` untuk CTA saja. Yang
ditambahkan adalah **tangga** di sekitarnya (`--blue-50` … `--blue-900`,
`--orange-50` … `--orange-600`), permukaan (`--surface-2`, `--paper`), bayangan
dua lapis, satu kurva gerak, dan kelas tipografi.

**Alasan.** Dengan hanya lima warna dasar, tiap komponen menebak sendiri nilai
antaranya: latar lembut, garis, dan warna teks di atas latar berwarna
ditentukan per berkas. Hasilnya biru muda yang berbeda-beda di tiap halaman.
Tangga warna membuat nilai antara itu punya satu sumber.

**Yang ikut berubah dan perlu diketahui Owner:**
- Kuning status digelapkan `#C88A0A` → `#A9760A`. Nilai lama tidak lolos
  kontras 4,5:1 untuk teks kecil di atas putih — di layar HP di bawah sinar
  matahari itu praktis tidak terbaca.
- Latar aplikasi digeser tipis `#F7F9FC` → `#F5F8FC`, dan kertas struk memakai
  warna hangat sendiri (`--paper #FDFBF7`). Kertas struk tidak pernah putih
  kebiruan.

**Ditolak.** Mengganti palet sepenuhnya (identitas brand induk Digify.ID ikut
hilang); memakai `oklch()` bawaan Tailwind v4 untuk tangga warnanya
(`html2canvas` tidak bisa membacanya — `CLAUDE.md` §9.1); menambah pustaka
komponen atau ikon (dilarang di `CLAUDE.md` §"What not to do", dan lambang
satu-satunya digambar sebagai SVG inline).

---

## 2026-07-28 · Tepi gerigi struk digambar SVG, bukan `mask-image` CSS

**Keputusan.** Tepi sobek di bawah struk (`components/ui/Struk.tsx` dan struk
contoh di halaman depan) berupa `<svg><polygon>`.

**Alasan.** Resep CSS yang lazim untuk gerigi memakai `mask-image` dengan
gradien berulang. Dukungannya masih belang-belang di WebView Android lama — dan
kalau gagal, yang muncul bukan tepi lurus melainkan struk yang **hilang
separuh**, karena mask yang tidak terbaca menyembunyikan elemennya. Untuk
pengguna yang mayoritas memegang HP Android murah, kegagalan seperti itu tidak
sepadan dengan hiasannya.

**Ditolak.** `mask-image` berulang; gerigi sebagai gambar PNG (satu permintaan
jaringan lagi di koneksi lambat, dan warnanya tidak ikut token).

---

## 2026-07-28 · Header dan baris tab menempel di atas (`position: sticky`)

**Keputusan.** Header aplikasi beserta baris sepuluh tab menempel di puncak
layar. Sebagai konsekuensinya `body` memakai `overflow-x: clip`, bukan
`overflow-x: hidden`.

**Alasan.** Halaman alat panjang: form penuh isian lalu hasil sepanjang satu
layar. Kalau navigasi ikut tergulir hilang, satu-satunya cara pindah alat
adalah menggulir balik ke paling atas — belasan usapan jempol setiap kali.

`hidden` tidak bisa dipakai bersama sticky: ia menjadikan `body` kotak gulir
sendiri, dan elemen sticky di dalamnya lalu menempel pada kotak yang tidak
pernah bergulir — artinya tidak menempel sama sekali. `clip` mencegah scroll
horizontal tanpa efek samping itu.

**Ditolak.** Bilah navigasi bawah ala aplikasi ponsel (sepuluh alat tidak muat,
dan keyboard HP menutupinya saat form diisi); menu tarik-turun (menyembunyikan
nama alat justru membuat alat 6–10 tidak pernah ditemukan).

---

## 2026-07-28 · Halaman depan tidak memakai testimoni atau angka pengguna

**Keputusan.** Halaman depan membuktikan diri lewat satu struk contoh berisi
hitungan lengkap yang bisa diperiksa sendiri oleh pembaca, bukan lewat testimoni,
logo klien, atau jumlah pengguna.

**Alasan.** Pembelinya pemilik warung yang sedang menimbang uang. Testimoni
karangan adalah cara tercepat kehilangan justru pembeli yang paling teliti. Dan
saat ini memang belum ada testimoni sungguhan untuk dipasang.

**Catatan untuk Owner.** Begitu ada pengguna nyata yang bersedia dikutip,
testimoni asli — nama warung, kota, angka yang dia sebut sendiri — bisa
ditambahkan di antara bagian "Cara pakai" dan "Pertanyaan". Harganya juga belum
dicantumkan di halaman ini; `PRD.md` §1 menyebut rentang Rp199.000–299.000, dan
angka pastinya perlu ditetapkan Owner sebelum ditulis di halaman depan.

**Ditolak.** Testimoni contoh dengan nama karangan ("Bu Sari, Bandung");
lencana "dipakai 1.000+ warung".

---

## 2026-07-28 · Baris tab geser diganti sidebar + lembar alat (menyimpang dari PRD §4)

**Keputusan.** Navigasi sepuluh alat tidak lagi berupa baris pil yang digeser
horizontal. Layar lebar memakai sidebar tetap; HP memakai lembar penuh yang
dipanggil lewat tombol "Semua alat". Halaman `/alat` tidak lagi melempar ke
Tab 1, melainkan jadi beranda alat berisi sepuluh kartu.

**Ini menyimpang dari `PRD.md` §4**, yang menyebut "tab bisa di-scroll
horizontal" sebagai salah satu wujud mobile-first. Yang dituju PRD — sepuluh
alat harus terjangkau di layar 360px tanpa memakan setengah layar — tetap
dipenuhi, hanya caranya berbeda.

**Alasan.** Baris pil punya tiga cacat yang tidak bisa diperbaiki tanpa
menggantinya:
- Alat 5 sampai 10 tidak pernah terlihat sebelum digeser. Yang tidak terlihat
  tidak dipakai — dan empat di antaranya adalah seluruh Growth Engine.
- Menggeser horizontal di dalam halaman yang juga digeser vertikal sering salah
  tangkap, apalagi dengan jempol di HP besar.
- Ia memakan satu baris tetap di puncak layar padahal isinya dipakai sesekali.

Sidebar dan lembar memakai komponen daftar yang sama persis, supaya orang yang
berpindah dari HP ke laptop tidak perlu belajar ulang letak alatnya.

**Jebakan teknis yang ketahuan saat diuji di Chromium sungguhan.** Lembar itu
wajib dipasang lewat `createPortal` ke `<body>`. Tombolnya hidup di dalam bilah
atas yang memakai `backdrop-filter`, dan elemen ber-filter menjadi *containing
block* untuk keturunan `position: fixed` — tanpa portal, `inset-0` mengacu ke
kotak bilah atas setinggi 60px, dan lembarnya muncul terjepit di puncak layar.

**Ditolak.** Bilah navigasi bawah ala aplikasi ponsel (sepuluh alat tidak muat,
dan keyboard HP menutupinya saat form diisi); menu tarik-turun (menyembunyikan
nama alat justru membuat alat 6–10 tidak pernah ditemukan); mempertahankan
baris pil dengan panah kiri-kanan (menambah dua target sentuh untuk menambal
masalah yang sebenarnya bukan soal panah).

---

## 2026-07-28 · Dipasang sebagai PWA, dengan service worker yang sengaja pelit

**Keputusan.** Aplikasi bisa dipasang ke layar utama HP (manifest, ikon,
`display: standalone`, `start_url: /alat`). Service worker-nya hanya menyimpan
berkas statis ber-hash.

**Alasan memasang.** Pembeli membuka aplikasi ini dari tautan WhatsApp, dan
tautan itu tenggelam dalam sehari. Ikon di layar utama adalah satu-satunya cara
ia menemukan lagi barang yang sudah dibayarnya minggu lalu.

**Alasan pelit.** Service worker yang rakus adalah cara termudah membuat
pengguna terjebak melihat versi lama — pada produk berisi angka uang, itu jauh
lebih buruk daripada sekadar lambat. Karena itu:
- `/api/*` tidak pernah disentuh. Di situ ada hasil hitungan, sesi, dan token.
- Halaman (navigasi) tidak pernah disimpan. Isinya bergantung cookie login, jadi
  halaman tersimpan bisa terlihat oleh orang berikutnya yang memakai HP yang
  sama — dan pasti basi. Saat jaringan mati, yang muncul halaman `/offline`.
- Yang disimpan hanya `/_next/static/*`, font, dan ikon. Nama berkasnya berubah
  tiap kali isinya berubah, jadi tidak mungkin basi.
- Di dev, service worker justru dicopot. SW yang menahan berkas statis di
  localhost membuat perubahan kode terlihat tidak berpengaruh, dan itu membuang
  waktu berjam-jam mencari penyebab yang salah.

**Ditolak.** `next-pwa`/Workbox (satu dependensi lagi, dan perilaku bawaannya
justru menyimpan halaman — persis yang tidak boleh di sini); mode offline penuh
(seluruh nilai produk ini ada di hitungan sisi server, jadi offline penuh cuma
menjanjikan sesuatu yang tidak bisa ditepati).
