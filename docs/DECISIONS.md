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

---

## 2026-08-08 · Halaman depan dibuat terbaca dalam lima detik

Sasarannya satu: pengunjung yang baru mendarat paham ini alat apa dan untuk apa,
tanpa membaca dokumen. Empat keputusan di bawah lahir dari menelaah halaman
depan pada lebar 360px.

### Tombol ajakan mengarah ke pembayaran, bukan ke /alat

**Keputusan.** Tombol utama mengarah ke `NEXT_PUBLIC_URL_BELI`; selama alamat
itu belum diisi, ia turun ke bagian "Cara mulai" di halaman depan.

**Alasan.** Sebelumnya tombol itu mengarah ke `/alat/biaya-menu`. Rute itu
dijaga: pengunjung tanpa sesi langsung dilempar ke `/masuk`, dan akun hanya
terbit lewat webhook affiliate.id setelah pembayaran — tidak ada pendaftaran
sendiri. Jadi setiap pengunjung baru yang menekan tombol terbesar di halaman
itu mendarat di form masuk yang tidak mungkin ia lewati, setelah dijanjikan
"gratis dicoba" dan "tanpa mendaftar apa pun". Untuk produk yang menjual
ketelitian soal uang, janji yang dibantah satu ketukan kemudian adalah kerugian
yang mahal.

**Ditolak.** Membiarkan tombolnya ke `/alat` dan hanya memperhalus kalimatnya
(masalahnya bukan kalimat, melainkan pintu terkunci); membuat mode coba tanpa
akun (itu perubahan produk dan kuota, bukan perubahan tampilan — dan PRD §9
menaruh pekerjaan kuota di fase 5); mengarang alamat pembayaran (kanal
pembayarannya memang masih terbuka di PRD §8.1).

**Catatan pemasangan.** `NEXT_PUBLIC_*` dijahit ke bundel saat `npm run build`,
bukan dibaca saat kontainer jalan. Karena itu ARG-nya dipasang di
`frontend/Dockerfile` dan diteruskan dari `docker-compose.prod.yml`. Tanpa itu,
mengisinya di `.env` tidak berpengaruh apa-apa dan alamatnya hilang diam-diam.

### Tangga tipografi mengganti tangga bawaan Tailwind

**Keputusan.** `--fs-*` dan `--lh-*` ditulis di `tokens.css`, lalu dipetakan ke
`--text-*` milik Tailwind lewat jembatan `@theme` di `globals.css`.

**Alasan.** Ukuran huruf dulu diputuskan per komponen: 85 `text-sm`, 44
`text-xs`, plus enam ukuran satu-satu seperti `text-[1.75rem]` dan
`text-[10px]`. Karena tangganya mengganti bawaan Tailwind, seluruh pemakaian
yang sudah ada ikut naik tanpa satu pun berkas komponen disentuh — dan
sesudahnya tidak ada lagi cara menulis ukuran huruf di luar tangga.

Lantainya dinaikkan (12px → 14px, 14px → 15px, teks isi 16px) karena
penggunanya pemilik warung setengah baya, di luar ruangan, sambil memegang HP.
Di sana 12px bukan teks kecil, melainkan teks yang tidak dibaca.

**Ditolak.** Menambah tangga baru berdampingan dengan tangga Tailwind (dua
tangga hidup bersama selalu berakhir dengan komponen memakai yang salah);
menaikkan SEMUA teks ke 16px (struk dan tabel jadi panjang tanpa menambah
paham — keterangan di dalam daftar tetap 15px).

### Kontras diperbaiki dengan menggelapkan, bukan mengganti warna

**Keputusan.** Oranye tombol, `--ink-soft`, dan ketiga warna status digelapkan
sampai lolos 4.5:1. Hue-nya tidak diubah. Rasio tiap pasangan dicatat di kepala
`tokens.css`.

**Alasan.** Teks putih di atas tombol utama hanya 2,79:1 — separuh dari yang
dibutuhkan, pada tombol terpenting di produk ini. Pita GREEN/YELLOW/RED, yang
justru membawa kesimpulan produk, semuanya di bawah 4:1 di atas wash-nya.
`--orange-600` sudah ada di tangga sejak awal, jadi ini bukan warna baru.

**Ditolak.** Memakai teks gelap di atas oranye terang (rasionya lebih tinggi
dan warnanya tetap persis, tapi tombol oranye bertulisan gelap terbaca sebagai
peringatan, dan itu berlaku ke seluruh tombol utama di aplikasi); mengganti
oranye dengan warna lain (itu rebranding, bukan perbaikan kontras).

### Nama pilar dan dua nama alat diterjemahkan

**Keputusan.** "Mesin Profit"/"Mesin Growth" → "Rapikan Untung"/"Tambah
Pembeli"; "Waste Tracker" → "Bahan Terbuang"; "Carousel (Teks)"/"(Gambar)" →
"Naskah Carousel"/"Gambar Carousel". Nama pilarnya kini tinggal di
`NAMA_KELOMPOK` pada `lib/tabs.ts`.

**Alasan.** Keempatnya tercetak persis di daftar yang dipakai pengunjung untuk
memutuskan "ini buat saya atau bukan", dan "Growth" bukan kata yang dipakai
pemilik warung. CLAUDE.md §3.3 memang sudah melarangnya. Kunci
`"Profit"`/`"Growth"` tetap istilah dalam kode — yang berubah hanya labelnya,
jadi tidak ada slug rute atau nama field API yang tersentuh.

**Ditolak.** Ikut mengganti "Ranking Menu" dan "Laporan Final" (dua-duanya kata
serapan yang sudah lazim dipakai sehari-hari); mengganti tagline "Digital. Make
Simple" (itu merek Digify.ID, bukan teks antarmuka — kontrasnya saja yang
diperbaiki).

---

## 2026-08-08 · Aturan yang menghasilkan angka ikut ditampilkan, bukan cuma hasilnya

**Keputusan.** Tiga tempat di Profit Engine sekarang menunjukkan dasar
hitungannya: ambang warna di papan ranking, jumlah baris bahan yang benar-benar
terhitung di Tab 1, dan besarnya komisi ojol yang sedang memakan untung di Tab 2.

**Alasan.** Sejak Tab 1–6 dilepas dari AI (28 Juli), alasan nomor dua yang
dicatat adalah: *"Kalau dia bertanya 'kenapa menu ini disuruh dihentikan?',
jawabannya bisa ditunjuk angkanya."* Kemampuan itu sudah dibeli — aturannya
deterministik dan ada test-nya — tapi tidak pernah dikirim ke layar. Aplikasinya
deterministik tapi belum transparan, dan bagi pemakainya keduanya terasa sama
saja: angka yang muncul entah dari mana.

Ketiganya satu masalah yang sama, dilihat dari tiga sisi:
- Pita status muncul sebagai vonis tanpa dasar; yang tidak tahu artinya memilih
  jalan paling aman, yaitu mengabaikannya.
- Baris bahan yang gagal diurai hilang tanpa jejak, dan biaya per porsi keluar
  terlalu rendah — lalu lima tab sesudahnya berdiri di atas angka itu.
- Kerugian ojol dijawab dengan harga baru tanpa pernah menyebut kerugian yang
  sedang berjalan.

**Ambang digandakan di frontend, dijaga test di backend.** `docs/API_CONTRACT.md`
mengikat dan menambah field ke response adalah perubahan kontrak yang butuh
persetujuan Owner (CLAUDE.md §10). Sebagai gantinya
`test_ambang_cocok_dengan_frontend` gagal kalau angkanya berbeda, dengan pesan
yang menyebut nama berkas frontend-nya.

**Batas keyakinan ditulis apa adanya.** Di Tab 1, JUMLAH baris yang terlewat
adalah hitungan pasti dan dinyatakan sebagai fakta; BARIS MANA yang terlewat
adalah dugaan (parser menormalkan nama bahan) dan ditulis "sepertinya baris ini".
Mencampur dua tingkat keyakinan di balik satu kalimat adalah cara tercepat
membuat satu tebakan meleset merusak kepercayaan pada seluruh angkanya.

**Ditolak.** Menambahkan ambang ke response API (perubahan kontrak untuk sesuatu
yang bisa dijaga test); menuliskan ambang langsung di komponen tanpa penjaga apa
pun (penggandaan yang melenceng berarti aplikasi berbohong dengan percaya diri);
menebak harga ojol pemilik warung sekarang untuk menghitung kerugiannya (angka
yang tidak bisa ditelusuri ke aturan mana pun); membuat panel "penjelasan" yang
selalu terbuka (papan ranking dibaca sambil berdiri — pertanyaan "kenapa?" baru
muncul setelah warnanya terlihat, jadi penjelasannya tertutup secara bawaan).

---

## 2026-08-08 · Struk bisa disimpan jadi gambar; penggeser harga dipasangi rambu

Dua tambahan yang berguna tapi tidak menambah kemampuan analisa — keduanya soal
apa yang bisa dilakukan pemiliknya dengan angka yang sudah ada.

### Struk jadi gambar

**Keputusan.** Keempat struk (Biaya Menu, Harga Jual, Bahan Terbuang, Laporan
Final) bisa disimpan jadi PNG, dengan lembar berbagi didahulukan daripada
unduhan.

**Alasan.** Hitungan yang paling sering perlu ditunjukkan ke orang lain justru
yang paling sulit dipindahkan; satu-satunya jalan sebelumnya adalah tangkapan
layar, yang di HP selalu terpotong. Memakai `html2canvas-pro` yang sudah
terpasang untuk carousel — tidak ada dependensi baru.

**Isi gambar sama persis dengan layar.** Tidak ada tanggal atau tanda air yang
cuma muncul di berkas. Janji produk ini "yang dilihat di sini yang akan keluar",
dan itu berlaku dua arah. Tanggalnya masuk ke nama berkas saja — gambar struk
beredar di WhatsApp jauh lebih lama daripada masa berlaku angkanya, dan nama
berkas adalah cara termurah menandai umurnya tanpa mengubah tampilan.

**Ditolak.** Ekspor PDF (masuk backlog PRD §11 #2, dan bukan bentuk yang dikirim
lewat WhatsApp); menambahkan tanda air/tanggal ke dalam gambar (menjadikan yang
dilihat berbeda dari yang keluar); mengubah `Struk` sendiri jadi komponen klien
(memaksa seluruh pemakainya ikut).

### Penggeser harga

**Keputusan.** Tab 2 mendapat penggeser harga yang dibatasi titik balik modal,
berkelipatan 500, memakai ambang warna yang sama dengan papan ranking, dan
menandai titik balik modal serta harga yang disarankan di atas relnya.

**Alasan menolaknya lebih dulu, lalu membangunnya begini.** Alat yang bisa
digeser mengundang orang menggeser sampai angkanya terlihat enak — persis
kebiasaan "kira-kira" yang produk ini ada untuk menggantikan. Yang membuatnya
layak dibangun adalah rambunya: dengan batas bawah dan warna yang berasal dari
aturan, penggeser berhenti jadi kotak coba-coba dan berubah jadi cara melihat
BENTUK hubungan harga dan untung — berapa yang hilang tiap Rp 500 diturunkan,
dan di titik mana warnanya berubah. Satu angka tidak pernah bisa menunjukkan itu.

**Ambangnya dicerminkan, bukan ditulis ulang.** `statusDariMargin()` mengikuti
`_status()` di `ranking.py`. Kalau penggesernya memakai ambang sendiri, dua layar
akan menyebut menu yang sama dengan dua warna berbeda.

**Ditolak.** Penggeser bebas tanpa batas bawah (menyediakan harga rugi sebagai
pilihan); memanggil `/api/pricing` tiap geseran (menunggu 10–30 detik per
gerakan, dan memakan kuota untuk hitungan yang rumusnya sudah kita punya).

### Yang TIDAK dibangun: perbandingan waste antar periode

Butuh data tersimpan, dan itu `MenuItem`/katalog di Fase 5 — CLAUDE.md melarang
mengerjakannya lebih awal, dan PRD §9 melarang mendahului fase.

Versi tanpa backend (menyimpan di `localStorage`) sengaja tidak dipilih, dengan
alasan yang sama yang sudah dipakai saat memutuskan service worker tidak boleh
menyimpan halaman: HP warung sering dipakai bergantian, dan angka keuangan yang
mengendap di perangkat bisa terlihat oleh orang berikutnya. Menyimpan riwayat
omzet dan biaya di `localStorage` adalah versi yang lebih buruk dari masalah itu,
bukan jalan pintas yang cerdik.

---

## 2026-08-08 · Isian form pindah ke URL — dan apa yang ikut terbawa

**Keputusan.** Seluruh isian sepuluh alat, termasuk tabel menu dan tabel bahan
serta posisi penggeser harga, disimpan di alamat halaman lewat
`history.replaceState`. Form masuk tidak ikut.

**Alasan.** Isian hilang tiap kali halaman dimuat ulang, dan hitungan tidak bisa
dikirim ke orang lain selain dengan menyuruhnya mengetik ulang semua angkanya.

**Ditolak.** `useSearchParams` (memaksa batas `<Suspense>` saat render statis dan
menjalankan ulang router tiap ketukan tombol); `pushState` (tombol "kembali"
jadi harus ditekan sekali per huruf); membaca URL saat render (HTML server dan
klien berbeda, React membuang seluruh pohonnya).

### ⚠ Yang berubah artinya — silakan ditimbang ulang

Menaruh isian di URL berarti **angka biaya, harga, dan penjualan mingguan warung
ikut tercatat di riwayat browser**, dan ikut terbawa setiap kali alamatnya
ditempel ke mana pun.

Itu bertentangan dengan alasan yang dipakai saat memutuskan service worker tidak
boleh menyimpan halaman (28 Juli): *HP warung sering dipakai bergantian, dan
angka keuangan yang mengendap di perangkat bisa terlihat oleh orang berikutnya.*
Riwayat browser adalah tempat mengendap yang persis sama.

Bedanya dengan `localStorage`: URL hanya terisi kalau halamannya memang sedang
dipakai, tidak bertahan sendiri setelah tab ditutup, dan bisa dibersihkan
pemiliknya. Dan yang didapat memang diminta: hitungan yang bisa dikirim.

Kalau pertukaran itu tidak sepadan, yang perlu dibatalkan cuma satu berkas —
`frontend/src/lib/useUrlState.ts` — dengan mengembalikan `useUrlState` menjadi
`useState` biasa di kesepuluh alat. Tidak ada bagian lain yang bergantung
padanya.

### Batas yang dijaga

- Nilai dari URL diperiksa bentuknya sebelum dipakai, dan objek disusun ulang
  dari kunci yang dikenal saja — alamat karangan tidak bisa menyuntikkan bentuk
  data asing ke form maupun ke badan permintaan API.
- URL rusak diam-diam kembali ke contoh bawaan. Pesan error untuk alamat salah
  ketik cuma menakuti tanpa memberi sesuatu yang bisa dikerjakan.
- Penggeser harga menolak nilai di luar rentang hitungan yang sedang tampil, dan
  kembali ke harga yang disarankan — **bukan** dijepit ke tepi rentang.
  Menjepit akan memunculkan harga yang tidak pernah diketik siapa pun dan tidak
  berasal dari aturan mana pun.
- Kata sandi tidak pernah masuk URL.

---

## 2026-08-08 · Pemeriksaan aksesibilitas: dua keputusan yang bisa ditinjau ulang

### Semua target sentuh naik ke `var(--tap)` (44px)

**Keputusan.** Tidak ada token `--tap-kecil`. Kontrol yang sebelumnya 36px atau
kurang — Salin, Keluar, Hapus menu, Hapus bahan — semuanya naik ke `--tap`.

**Yang dibatalkan.** Komentar di `EditorMenu.tsx` membenarkan 36px sebagai
kesengajaan: *"aksi merusak yang tidak boleh segampang menekan tombol utama"*.
Alasan itu sengaja dibatalkan. Memperkecil sasaran tidak mencegah salah tekan —
ia memindahkan salah tekan ke tetangganya, dan yang paling menanggung akibatnya
justru orang dengan keterbatasan gerak, yang paling tidak mampu menanggungnya.
Tujuan "jangan terlalu gampang ditekan" tetap dikerjakan, lewat bobot visual:
merah, tanpa latar, tanpa bingkai.

**Satu perkecualian, dicatat di kodenya.** Tombol "Lihat" kata sandi duduk di
DALAM isian setinggi 44px; 44px penuh membuatnya menempel tepi. Disisakan 4px
tiap sisi (36px), masih di atas ambang WCAG 2.5.8.

**Ditolak.** Token `--tap-kecil: 36px` — itu menuliskan penyimpangan dari aturan
proyek sendiri ke dalam lapisan token, tempat ia akan menyebar tanpa ditanya
lagi.

### Tautan "lewati navigasi" ditambahkan meski ada aturan menahan chrome baru

**Keputusan.** Rangka alat mendapat tautan lewati yang tak terlihat sampai
difokus.

**Alasan.** Sebelas tautan alat mendahului isi halaman, di tiap halaman. Pemakai
pembaca layar bisa melompatinya lewat landmark `<nav>`/`<main>` yang sudah ada —
jadi WCAG 2.4.1 memang sudah terpenuhi — tapi pemakai keyboard yang melihat
layar tidak dilayani sama sekali oleh landmark. Karena itu tautan ini tidak
menduplikasi apa pun: ia melayani kelompok yang saat ini tidak punya jalan
pintas. Tidak menambah satu piksel pun ke tampilan biasa.

### Catatan: satu perbaikan sesi lalu diam-diam memperburuk hal lain

Jeda 300ms pada kerangka pemuatan (dipasang untuk menghentikan kedipan) membuat
wilayah `role="status"` sering tidak sempat terpasang di Tab 1–6. Akibatnya
pemakai pembaca layar tidak mendengar apa pun dari awal sampai akhir hitungan.
Diperbaiki dengan memindahkan fokus ke blok hasil, bukan dengan membatalkan
jedanya. Layak diingat bahwa perbaikan di satu sumbu bisa merusak sumbu lain
yang tidak sedang diperiksa.

---

## 2026-08-08 · Aplikasi menerangkan hitungannya, bukan cuma mengeluarkannya

**Latar.** `PRD.md` §1 menyebut masalahnya bukan "pemilik warung tidak punya
angka", melainkan "harga ditentukan kira-kira". Artinya produk ini menjual
pemahaman, bukan sekadar keluaran. Sejak Profit Engine dilepas dari AI
(28 Juli), kemampuan menerangkan itu sudah dibeli — tapi sebagian besar
berhenti di dalam kode.

**Yang dikerjakan.** Contoh terpandu sebelum form pertama; langkah konversi
satuan dicetak di tiap baris struk; tangga empat langkah di balik harga yang
disarankan; metode Kasavana–Smith disebut namanya berikut angka kedua sumbunya;
asumsi 4 minggu dan "separuh bisa dicegah" dinyatakan di tempat angkanya
muncul; "margin" didefinisikan saat pertama kali dipakai; penggeser "kalau
harga bahan naik" untuk menjawab soal ketahanan.

### ⚠ Angka terukur vs angka perkiraan — pemisahan yang sebelumnya tidak ada

Temuan paling penting dari pemeriksaan ini: `food_waste_percentage` di Tab 1
adalah **tebakan kami dari tabel kategori bahan**, ditampilkan berdampingan
dengan biaya per porsi — yang diturunkan dari nota belanja pengguna sendiri —
dalam kotak yang bentuknya sama persis. Juru masak cermat dan juru masak boros
mendapat angka yang sama.

Untuk produk yang seluruh janjinya "angkanya bisa ditunjuk asalnya", mencampur
angka terukur dan angka karangan tanpa tanda apa pun adalah kerusakan yang
paling mahal, dan itu terjadi di layar andalannya. Sekarang dipisahkan secara
eksplisit.

**Aturan yang berlaku ke depan:** setiap angka yang TIDAK berasal dari masukan
pengguna harus menyebut dirinya perkiraan, di tempat ia muncul.

### Pola: cerminan konstanta backend dijaga test, bukan dikirim lewat API

Tiga penjelasan baru butuh nilai antara yang tidak ada di response
(`BOBOT_KOMPETITOR`, `KELIPATAN_HARGA`, `AMBANG_LARIS`). Kontrak API mengikat
dan menambah field butuh persetujuan Owner, jadi polanya sama seperti ambang
warna: digandakan di `frontend/src/lib/aturan.ts`, dijaga test di backend yang
menyebut nama berkas frontend-nya.

Khusus tangga harga ada pagar tambahan: susunan ulangnya dicocokkan dengan
angka backend, dan **kalau berbeda sedikit pun seluruh penjelasan tidak
ditampilkan**. Penjelasan yang meleset dari angkanya sendiri lebih merusak
daripada tidak ada penjelasan — yang boleh hilang penjelasannya, bukan
kebenaran angkanya.

### Ditolak

Tooltip (tidak terlihat di layar sentuh, tidak bisa dicari); halaman "tentang"
atau modal terpisah (harus dicari lebih dulu, padahal yang perlu diterangkan
justru hal yang pemakainya belum tahu perlu ditanyakan); rincian waste per
kategori di Tab 1 (kategorinya tidak ada di response — butuh perubahan kontrak);
membalik rumus lewat aljabar untuk mencari titik ambang di penggeser ketahanan
(dicari selangkah demi selangkah dengan rumus yang sama, supaya angka yang
ditunjuk pasti angka yang benar-benar muncul saat digeser ke sana).

---

## 2026-08-08 · Deploy lewat image di GHCR, bukan build di server

**Keputusan.** GitHub Actions membangun empat image (`digify-backend`,
`digify-frontend`, `digify-nginx`, `digify-backup`) setiap push ke main dan
mendorongnya ke GitHub Container Registry. Server produksi hanya menyimpan
`docker-compose.yml` + `.env`, lalu `docker compose pull && up -d`.
Panduan: `docs/DEPLOY_VPS.md`.

**Alasan.**
1. **Server tidak perlu RAM untuk build.** `npm run build` Next.js adalah bagian
   paling rakus di project ini. Menjalankannya di VPS 4 GB yang sedang melayani
   pembeli berarti aplikasinya melambat setiap kali di-update.
2. **Update jadi tidak menakutkan.** Satu perintah, tanpa `git pull` di server,
   tanpa risiko konflik atau berkas asing di folder produksi.
3. **Rollback nyata.** Tiap build juga bertag `sha-<commit>`. Kembali ke versi
   sebelumnya = ganti satu baris di `.env`, bukan git revert lalu build ulang
   20 menit sementara aplikasi rusak.
4. **Rahasia tidak pernah ada di image.** `.dockerignore` menahan `.env`, dan
   `nginx/.dockerignore` menahan `certs/` — image ini didorong ke registry, jadi
   kunci privat TLS yang ikut terbawa berarti kunci yang bocor.

**Dua arsitektur sekaligus** (`linux/amd64` + `linux/arm64`). Tahap gratis
berjalan di Oracle Cloud Ampere yang ARM, tahap berbayar di VPS Jakarta yang
x86. Satu tag melayani keduanya, jadi pindah server nanti tidak perlu build
ulang. Harganya: build arm64 lewat emulasi QEMU, ~15–30 menit yang pertama.

**`docker-compose.prod.yml` tetap ada** dan tidak diubah — dia jalan tanpa GHCR
sama sekali, dan itu jaring pengaman kalau Actions atau registry sedang mati.

**Yang berubah bentuknya:**
- Konfigurasi Nginx dan `backup.sh` sekarang dijahit ke dalam image, bukan
  di-bind mount. Ini yang membuat server benar-benar tidak butuh salinan repo.
- Image Nginx membawa **sertifikat self-signed sementara**. Tanpa itu Nginx
  menolak start karena `fullchain.pem` belum ada, padahal certbot butuh Nginx
  hidup di port 80 untuk memverifikasi domain — telur dan ayam. Docker mengisi
  volume kosong dari isi image, jadi sertifikat asli menimpanya begitu terbit.
- Perpanjangan TLS jadi otomatis lewat kontainer `certbot` + reload berkala
  Nginx. Sebelumnya certbot di host dan salin manual (`PRODUKSI.md` §5).
- `NEXT_PUBLIC_URL_BELI` pindah dari `.env` server ke **repository variable**
  GitHub. Nilainya memang dijahit saat build, dan build-nya sekarang di CI.
  Konsekuensinya: mengubah alamat pembayaran butuh menjalankan ulang workflow.

**Yang ditolak.** Membangun di server lewat SSH deploy action (menaruh kunci SSH
server di GitHub, dan tetap membebani RAM produksi); Docker Hub (rate limit pull
anonim, dan butuh akun terpisah — GHCR ikut izin repo yang sudah ada);
menjadikan paket GHCR publik demi menghindari `docker login` (image-nya tidak
berisi rahasia, tapi berisi seluruh kode aplikasi).

### Ditemukan saat menguji: backup gagal yang mengaku berhasil

`scripts/backup.sh` menguji status `pg_dump | gzip`, dan itu status **gzip** —
yang sukses membungkus keluaran kosong dari `pg_dump` yang ditolak database.
Hasilnya berkas 20 byte, log bertuliskan "Backup selesai", dan tidak ada
tanda apa pun sampai hari restore dibutuhkan. Diperbaiki dengan `set -o pipefail`.

Ini persis skenario yang diperingatkan komentar di skrip itu sendiri, dan
alasan kenapa `PRODUKSI.md` §3 (uji restore) wajib dijalankan, bukan dianggap
formalitas.

### Ditemukan saat build CI pertama: lockfile hanya mengenal satu arsitektur

Build arm64 hijau, amd64 mati: `Cannot find module '../lightningcss.linux-x64-musl.node'`.

`frontend/package-lock.json` lahir di Alpine/Apple Silicon, dan npm punya bug
lama ([npm/cli#4828](https://github.com/npm/cli/issues/4828)): saat menulis
lockfile ia hanya mencatat biner platform untuk mesin yang sedang dipakai.
Isinya jadi arm64-musl saja — tidak ada satu pun varian x64 untuk
`lightningcss`, `@tailwindcss/oxide`, maupun `sharp`.

Diperbaiki dengan menyebut keenam biner itu eksplisit di `optionalDependencies`
`frontend/package.json`, lalu membuat ulang lockfile di dalam kontainer. npm
melewati yang tidak cocok dengan mesinnya, jadi di macOS tidak ada yang berubah.
**Ini bukan dependency baru** — semuanya biner platform milik paket yang sudah
dipakai, dan versinya wajib dikunci sama persis dengan paket induknya.

Yang membuat ini pantas dicatat: masalahnya tidak akan pernah muncul selama
pengembangan hanya di Mac dan deploy hanya ke ARM. Ia menunggu sampai pindah ke
VPS Jakarta yang x86 — persis saat sedang buru-buru migrasi. Membangun kedua
arsitektur sejak sekarang yang memunculkannya hari ini.

### Ditemukan saat deploy pertama: SECURE_SSL_REDIRECT mematikan login

Gejalanya menyesatkan: `/admin/` normal, halaman depan normal, tapi login gagal
dengan "Koneksi ke server terputus" — pesan yang menuduh jaringan pemakai.

Sebabnya `DJANGO_SECURE_SSL_REDIRECT=1`. Django mengalihkan setiap permintaan
yang tidak membawa `X-Forwarded-Proto: https`. Nginx mengirim header itu, jadi
`/admin/` dan `/api/webhooks/` selamat. Tapi Route Handler Next.js memanggil
Django lewat `http://backend:8000` **tanpa** header itu — Django mengalihkannya
ke `https://backend:8000`, dan tidak ada yang mendengarkan di 443 di sana.
Hasilnya connect timeout, yang muncul ke pemakai sebagai masalah internet.

Disetel `0`. Bukan kompromi: TLS diputus di Nginx, dan Nginx sudah mengalihkan
`http→https` di tepi (terbukti 301). Django tidak pernah menghadap internet,
jadi pengalihannya hanya pernah kena lalu lintas internal. HSTS, `SESSION_COOKIE_SECURE`,
dan `CSRF_COOKIE_SECURE` semuanya tetap menyala.

Yang membuatnya pantas dicatat: ketiga jalur yang gampang diuji (halaman depan,
berkas statis, admin) semuanya lewat Nginx dan semuanya hijau. Satu-satunya
jalur yang rusak adalah satu-satunya yang tidak lewat Nginx. Sehat di
permukaan bukan bukti sehat — makanya uji login sungguhan masuk daftar.

---

## 2026-08-08 · Deploy otomatis: push ke main → server ikut berubah

**Keputusan.** Pipa penuh di `.github/workflows/build-images.yml`:
`uji-backend` + `uji-frontend` → `bangun` (4 image) → `terapkan` (SSH ke server).
Satu test merah = tidak ada image dibangun dan server tidak disentuh.

**Gerbang uji ditambahkan lebih dulu, dan itu bukan pelengkap.** Sebelum ini CI
membangun image tanpa menjalankan satu test pun — 288 test backend tidak pernah
dieksekusi. Menyambungkan deploy otomatis ke pipa seperti itu bukan otomatisasi,
cuma cara lebih cepat menerbitkan kerusakan ke pembeli.

**Kunci SSH-nya tidak bisa membuka shell.** Ini yang membalik keputusan
sebelumnya (yang menolak SSH deploy action karena "menaruh kunci SSH server di
GitHub"). Kuncinya dipasang di `~/.ssh/authorized_keys` sebagai:

```
restrict,command="/opt/digify/deploy.sh" ssh-ed25519 AAAA…
```

`restrict` mematikan pty, port forwarding, agent forwarding, dan X11.
`command=` membuat apa pun yang diminta diabaikan — yang jalan selalu skrip itu.
Sudah diuji: `ssh … 'cat /opt/digify/.env'` menjalankan deploy, bukan mencetak
rahasia. Kalau `VPS_SSH_KEY` bocor, yang bisa dilakukan penyerang hanya menyuruh
server menarik ulang image milik kita sendiri.

**Sidik jari server disematkan** (`VPS_HOST_KEY`), bukan `ssh-keyscan` saat
jalan. keyscan mempercayai apa pun yang menjawab hari itu.

**`deploy.sh` merah kalau situsnya mati.** Setelah `up -d` ia menunggu halaman
depan menjawab 200, maksimal 90 detik, lalu keluar dengan status gagal beserta
40 baris log kalau tidak. Deploy yang "berhasil" tapi meninggalkan situs kosong
adalah kegagalan paling mahal: CI hijau, pemakai melihat layar putih.

**Batasnya, dan ini nyata:** `deploy.sh` hanya menjalankan `docker compose pull`
+ `up -d`. **Perubahan pada `docker-compose.yml` atau `.env` TIDAK ikut
terkirim** — service baru, volume baru, atau variabel baru tetap harus disalin
manual dengan `scp` lalu deploy. Sengaja: mengizinkan kunci itu menulis berkas
compose sama saja mengembalikan akses shell, karena compose bisa me-mount
apa pun dari host.

**Yang ditolak.** Watchtower (tidak butuh rahasia di GitHub, tapi menunda deploy
sampai satu siklus polling, menambah dependency pihak ketiga, dan sama-sama
tidak bisa menerapkan perubahan compose); deploy manual (aman, tapi satu langkah
yang gampang lupa dan bikin server diam-diam tertinggal dari main).

**Rollback tetap satu baris:** `IMAGE_TAG=sha-<commit>` di `.env` server lalu
jalankan `deploy.sh`. Itu alasan tag `sha-` ada.

---

## 2026-08-11 · Tab 10: contoh slide dan slot foto tampil sebelum tombol ditekan

**Latar.** Umpan balik dari calon pengguna (pemakai sistem POS) atas tiga hal:
input terasa terlalu manual, penasaran dengan empat alat Tambah Pembeli dan
ingin "langsung jadi contoh gambar carouselnya" plus unggah foto sendiri, dan
bertanya apakah tampilannya berubah kalau dibuka di HP.

Dua dari tiga sudah ada di produk sejak Fase 3 — unggah foto per slide, dan
tata letak yang memang mobile-first. Yang tidak ada adalah **caranya
terlihat**. Ini keputusan tentang urutan, bukan tentang fitur baru.

**Keputusan.**

1. **Contoh empat slide jadi tampil di atas form Tab 10**, terbuka, digeser
   mendatar. Datanya statis di `lib/contoh.ts`, tidak pernah menyentuh backend.
2. **Slot foto pindah ke atas tombol "Buatkan gambar carousel"**, satu slot
   bernomor per slide, satu jendela pilih berkas bisa mengambil beberapa foto
   sekaligus. Keadaan fotonya naik dari `PapanCarousel` ke halaman
   (`useFotoSlide`) supaya tidak hilang saat slide-nya jadi.
3. **Kalimat "fotonya foto Anda sendiri" ditulis di tiga tempat yang dibaca
   sebelum alatnya dibuka**: daftar alat, halaman pemasaran, keterangan kartu.

**Alasan.** Tab 10 satu-satunya alat yang keluarannya berupa berkas, dan itu
yang membuatnya berbeda dari sekadar alat analisa. Tapi wujud barang jadinya
baru terlihat setelah menunggu 10–30 detik: orang diminta menunggu untuk
sesuatu yang belum pernah ia lihat. Hal yang sama berlaku untuk unggah foto —
ia hidup di papan slide, yang muncul setelah pembuatan selesai, jadi yang
sedang menimbang produknya berhenti jauh sebelum menemukannya lalu menyimpulkan
foto masakannya dibuatkan mesin. Kesimpulan itu wajar, karena tak satu pun
kalimat di produk ini pernah membantahnya.

**Yang ditolak.**

- **Contoh yang dilipat (`<details>`) seperti ContohTerpandu di Tab 1.** Tab 1
  menerangkan CARA sebuah angka dihitung — wajar dilipat setelah dipahami
  sekali. Yang ini bukan penjelasan, melainkan barang jadinya sendiri; dilipat
  berarti kembali jadi janji di dalam kalimat.
- **Foto sungguhan di dalam contoh.** Contohnya memakai kotak krem berikon,
  sama seperti slide tanpa foto yang sebenarnya, dengan satu kalimat yang
  menerangkan kotak itu tempat foto pengguna. Menempelkan foto stok akan
  memamerkan hasil yang tidak bisa didapat siapa pun tanpa memotret dulu.
  Kalau nanti ada foto masakan milik sendiri yang boleh dipakai, contohnya
  bisa ditingkatkan tanpa mengubah strukturnya.
- **Menimpa slot dari slide 1 saat memilih beberapa foto.** Foto masuk ke slot
  yang masih kosong secara berurutan. Orang yang sudah memberi foto slide 1
  lalu memilih satu foto lagi jelas memaksudkannya untuk slide berikutnya.

**Yang belum dikerjakan** (gelombang berikutnya, dari umpan balik yang sama):
penjagaan berkas HEIC dari iPhone — `bacaFotoSebagaiDataUrl` menerimanya, tapi
peramban tidak bisa menggambarnya ke canvas sehingga PNG-nya gagal diam-diam;
unduh semua slide sekaligus; Web Share ke Instagram; dan tempel-massal daftar
menu untuk mengurangi ketikan.

---

## 2026-08-11 · Gerbang uji frontend: runner bawaan Node, bukan Vitest

**Keputusan.** `npm test` menjalankan `node --test`. Tidak ada paket uji yang
dipasang, `package-lock.json` tidak tersentuh, dan langkah `Test` masuk ke job
`uji-frontend` di CI.

**Alasan.** Sampai hari ini frontend tidak punya satu pun uji otomatis. Itu
masih bisa ditawar selama isinya komponen tampilan, tapi berhenti bisa ditawar
begitu ada pengurai teks bebas yang mengisi kolom modal dan harga.

**Kenapa bukan Vitest**, yang jelas lebih enak dipakai: Vitest menarik esbuild
dan rollup, dan keduanya berbentuk biner per-platform — bentuk yang persis sama
dengan `lightningcss`, `@tailwindcss/oxide`, dan `sharp` yang sudah pernah
mematikan build amd64 di repo ini (catatan "lockfile hanya mengenal satu
arsitektur" di atas). Memasangnya berarti mengulang pekerjaan menyebut biner
satu per satu di `optionalDependencies`, dan menanggung risiko itu lagi setiap
kali versinya naik. Runner bawaan Node 22 sudah membaca TypeScript langsung —
diuji di `node:22-alpine`, image yang sama dipakai CI dan Docker, bukan hanya
di macOS.

**Harganya, dan ini nyata:** tidak ada watch mode, tidak ada `expect()`, tidak
ada mocking. Cukup untuk fungsi murni. **Kalau nanti butuh menguji komponen
React, keputusan ini harus ditinjau ulang** — jangan dipaksakan.

`tsconfig.json` menyalakan `allowImportingTsExtensions` karena Node ESM menuntut
ekstensi ditulis lengkap. Aman: opsi itu memang hanya boleh dipakai bersama
`noEmit`, yang sudah menyala.

---

## 2026-08-11 · Daftar menu bisa ditempel sekaligus, diurai di frontend

**Keputusan.** Kotak "Sudah punya daftarnya? Tempel sekaligus" di dalam
`EditorMenu` (Tab 3 dan Tab 4), dengan pengurai aturan di
`frontend/src/lib/uraiDaftarMenu.ts`.

**Alasan.** Umpan balik calon pengguna, seorang pemakai sistem POS: "kira-kira
ada nggak yang sistemnya nggak terlalu manual nulisnya?" Sepuluh menu berarti
empat puluh isian dengan jempol. `MenuItem` tersimpan sudah menolong dari menu
kedua dan seterusnya, tapi pengisian PERTAMA tetap manual seluruhnya — dan itu
pintu masuk produk ini.

**Kenapa di frontend, bukan endpoint baru.** Ini aturan murni: tidak butuh AI
(Tab 1–6 memang sudah tidak memakainya sejak 28 Juli) dan tidak butuh data dari
server. Menaruhnya di frontend berarti kontrak API yang sudah dibekukan tidak
bertambah, tidak ada biaya panggilan, dan tetap jalan saat aplikasi dibuka
offline sebagai PWA. Konsekuensinya: ada dua pengurai teks bebas di repo ini
(`parser_bahan.py` untuk bahan, yang ini untuk menu). Keduanya memakai aturan
angka yang sama — titik pemisah ribuan, koma desimal — dan itu harus tetap
begitu; angka yang sama tidak boleh punya dua arti di dua tempat.

**Dua jebakan yang ditemukan lewat uji, bukan lewat membaca ulang kode.**
Keduanya punya akibat yang sama dan sama-sama tanpa pesan error:

1. **Koma menanggung dua tugas dalam bahasa Indonesia** — pemisah daftar dan
   pemisah desimal. "1500,6" sempat terpotong jadi 1500 dan 6, dan seluruh
   kolom sesudahnya bergeser satu tempat: modal terbaca sebagai harga jual.
   Sekarang artinya diputuskan sekali untuk seluruh baris — satu koma rapat
   dianggap desimal, dua atau lebih dianggap pemisah kolom gaya CSV (bentuk
   ekspor kasir, yang justru paling ingin dilayani). Batas itu sah karena
   ketiga kolomnya bilangan bulat.
2. **Angka bersatuan di dalam nama** ("Es Teh 500ml") sempat terbaca sebagai
   modal.

**Yang ditolak.** Layar konfirmasi antara tempelan dan daftar — barisnya sendiri
sudah jadi pratinjau: terlihat, bisa diubah, dan belum terkirim ke mana pun.
Menambah di belakang daftar yang ada, bukan menimpanya — yang ditimpa hampir
selalu contoh bawaan, dan menambah di belakangnya justru meninggalkan menu
contoh yang bukan miliknya tercampur dalam hitungan profitnya sendiri.

**Batasnya.** Tab 5 (Laporan) dan Tab 7 (Ide Menu) belum kebagian: bentuk
barisnya berbeda (harga lama/harga baru, dan nama/harga/margin), jadi
pengurainya perlu aturan sendiri. Keduanya sudah bisa memuat daftar tersimpan,
jadi ketikan ulangnya tidak sebanyak Tab 3 dan 4.

---

## 2026-08-11 · Foto masuk diperiksa dulu; slide bisa keluar sekaligus

Gelombang kedua dari umpan balik calon pengguna yang sama.

### Foto yang tidak bisa digambar ditolak di pintu masuk

**Masalahnya diam.** `FileReader` menerima berkas apa pun, termasuk yang
peramban tidak tahu cara menggambarnya — paling sering HEIC bawaan kamera
iPhone. Berkas begitu lolos tanpa keluhan: `<img>`-nya kosong, html2canvas
menggambar kekosongan itu, dan yang terunduh adalah slide cantik berlubang di
tengah. Tidak ada pesan galat di mana pun. Pemiliknya baru tahu setelah
gambarnya terlanjur diposting — dan pemilik iPhone bukan kasus pinggiran.

**Diperiksa dengan `decode()`, bukan ditebak dari ekstensi.** Safari BISA
menggambar HEIC. Menolak berdasar nama berkas akan menolak foto yang
sebenarnya baik-baik saja di HP pemiliknya. Nama berkas hanya dipakai memilih
kalimat SETELAH decode-nya benar-benar gagal, supaya petunjuknya bisa menyebut
HEIC dan cara mengubahnya jadi JPG.

**Sekalian dikecilkan** ke sisi terpanjang 1600px. Area foto di slide cuma
~920px, sementara satu jepretan HP hari ini gampang 4000px dan 8 MB — dikali
empat slide, disimpan sebagai data URL di dalam keadaan React, cukup untuk
mematikan tab di HP kelas menengah tepat setelah foto keempat dipilih.

### Simpan atau bagikan seluruh set sekali jalan

**Bagikan didahulukan** kalau perambannya mendukung. Bukan kenyamanan: pemakai
kita memegang HP di tempat usaha. Tanpa Web Share urutannya unduh → buka
Galeri → cari berkasnya → buka Instagram → pilih lagi. Dukungan ditanyakan
dengan berkas contoh sungguhan, karena `navigator.share` ada di banyak peramban
desktop yang justru menolak berkas.

**Unduh massal berurutan, bukan serentak**, dengan jeda 350 ms. Peramban
memperlakukan unduhan beruntun yang dipicu skrip sebagai perilaku mencurigakan
dan diam-diam membuang sebagian.

### Yang sengaja TIDAK dikerjakan: tombol "ambil foto" langsung dari kamera

Ada di daftar gelombang kedua, lalu dibatalkan setelah diperiksa. `capture`
pada `<input type=file>` **menghapus pilihan**, bukan menambah: Android dan iOS
sudah menawarkan "Kamera / Galeri / Berkas" begitu isian berkas disentuh.
Menambahkan `capture` justru mengunci ke kamera dan membuat orang yang fotonya
sudah ada di galeri kehilangan jalan. Jalur kameranya sudah tersedia hari ini,
lewat lembar pilihan milik sistem.

### Batasnya

Bagian ini bergantung pada DOM — `decode()`, canvas, `navigator.share` — jadi
tidak ikut terjaring `node --test`, yang jalan tanpa peramban. Yang bisa diuji
otomatis di sini cuma sedikit; sisanya perlu dicoba di HP sungguhan, terutama
iPhone, karena di situlah jalur HEIC-nya hidup.

Belum dikerjakan: seret-dan-lepas di layar lebar, dan mengatur posisi/zoom foto
di dalam bingkai slide.

---

## 2026-08-11 · Tempel daftar juga di Tab 6, dan aturan angkanya jadi milik bersama

**Keputusan.** Kotak "Tempel sekaligus" sekarang dipakai dua tab. Kerangkanya
jadi komponen umum (`TempelDaftar`), dan aturan membaca angka pindah ke
`frontend/src/lib/uraiTeks.ts`.

**Kenapa Tab 6 yang berikutnya.** Ia form paling berat di seluruh produk: enam
isian per bahan, dikali sepuluh bahan, dengan jempol. Ironisnya ia juga tab
yang datanya paling mirip catatan belanja — bentuk yang memang sudah dimiliki
orangnya, dan yang sudah terbukti bisa diurai sejak Tab 1.

**Aturan angka jadi satu berkas** karena kedua pengurai membutuhkannya sama
persis. Kalau salinannya ada dua, cepat atau lambat keduanya berbeda, dan angka
yang sama akan punya dua arti di dua layar. Pemindahannya murni: 29 uji yang
sudah ada lulus tanpa satu pun diubah.

**Urutan tanpa label mengikuti urutan ISIAN DI LAYAR**, bukan urutan field di
dalam kode (untuk Tab 6: beli, terbuang, harga). Yang dibaca orang saat menulis
daftarnya adalah layar. Satuan tidak menempati posisi sendiri — ia menempel
pada angkanya ("1000 gram"), persis seperti orang menulis catatan belanja.

**Satu aturan bersama ikut diperbaiki**, dan ini yang paling pantas dicatat.
Tab 6 memunculkan kasus yang tidak ada di daftar menu: **jumlah bahan wajar
berpecahan** ("1,5 kg | 0,25"), sementara di daftar menu ketiga kolomnya selalu
bulat. Dugaan lama "dua koma rapat berarti pemisah kolom" jadi salah di sini
dan membuat 1,5 terbaca 1. Sekarang pemisah tegas didahulukan: kalau barisnya
sudah punya garis tegak, titik koma, atau tab, komanya PASTI desimal, berapa
pun jumlahnya. Baru kalau tidak ada pemisah tegas, banyaknya koma rapat yang
memutuskan.

Ditemukan oleh uji, bukan oleh membaca ulang kode — dan itu uji yang baru ada
sejak hari ini.

**Impor relatif berekstensi** (`./uraiTeks.ts`), bukan alias `@/`, karena
berkas-berkas ini dijalankan langsung oleh Node lewat `node --test` dan Node
tidak tahu apa-apa soal alias tsconfig. Sudah dipastikan bundler Next tetap
membacanya: image prod dibangun ulang dan compiled successfully. **Kalau nanti
menambah pengurai baru di `lib/`, ikuti pola ini** — memakai `@/` di sana akan
membuat ujinya mati dengan pesan yang tidak menjelaskan apa-apa.

**Batasnya, tidak berubah dari catatan sebelumnya.** Tab 5 (Laporan) dan Tab 7
(Ide Menu) masih belum kebagian: bentuk barisnya berbeda (harga lama/harga
baru, dan nama/harga/margin). Keduanya sudah bisa memuat daftar tersimpan, jadi
ketikan ulangnya jauh lebih sedikit daripada Tab 3, 4, dan 6.

---

## 2026-08-11 · `GEMINI_MODEL` pindah ke `gemini-3.5-flash` — 2.5 ditarik Google

**Kejadiannya.** Tab 7–10 mati di produksi. Yang dilihat pemakai cuma "Belum
berhasil. Coba ulangi sebentar lagi ya." Yang sebenarnya terjadi, dari log
backend di server:

```
google.genai.errors.ClientError: 404 NOT_FOUND
  This model models/gemini-2.5-flash is no longer available to new users.
```

Kuncinya sehat — ia lolos otentikasi, dan 404-nya soal model, bukan izin.
**Seluruh keluarga 2.5 ikut tertarik**: `gemini-2.5-flash-lite` gagal dengan
pesan yang sama persis. Modelnya masih muncul di daftar `models.list`, tapi
menolak `generateContent` untuk kunci baru — jadi memeriksa daftar model saja
tidak cukup untuk tahu apa yang benar-benar bisa dipakai.

**Keputusan.** `GEMINI_MODEL=gemini-3.5-flash`, diuji sungguhan lewat
`call_gemini` di server: `status=ok durasi=2828ms retry=0`.

**Kenapa versi terpaku, bukan `gemini-flash-latest`.** Alias tidak akan pernah
basi lagi, dan itu memang menggoda setelah kejadian ini. Ditolak karena
CLAUDE.md §3 memperlakukan keluaran prompt sebagai hal yang harus stabil:
alias membuat Google menukar model di bawah prompt yang sudah divalidasi, tanpa
satu pun commit yang bisa ditunjuk saat mutu caption berubah. Basi yang
ketahuan sekali dua tahun lebih murah daripada regresi diam-diam.

Yang diuji dan hasilnya: `gemini-3.5-flash` 2,9 detik · `gemini-3.6-flash`
4,3 detik · `gemini-flash-latest` 3,7 detik · `gemini-3.1-flash-lite` 0,9 detik
(paling murah, tapi mutu tulisannya di bawah tier flash, dan tulisan itu justru
produknya) · `gemini-2.5-flash-lite` gagal 404.

**Yang paling pantas dicatat, dan ini bukan soal nama model.** Kerusakan
permanen tampil dengan kalimat yang menjanjikan gangguan sementara. Pemilik
warung akan menekan tombolnya berulang kali, selamanya, lalu menyimpulkan
produknya rusak — dan tidak ada satu pun tanda yang sampai ke Owner. Pesannya
sendiri sudah benar untuk pembeli; yang tidak ada adalah jalan bagi Owner untuk
melihat bedanya. `/api/health` sudah menyalakan indikator "Server aktif" dan
bisa diperluas melaporkan kesiapan AI — belum dikerjakan, dan ini alasannya.

**Catatan operasional.** `GEMINI_MODEL` hidup di `.env` server, dan `deploy.sh`
tidak pernah mengirim `.env` (lihat catatan 8 Agustus). Jadi mengubah bawaan di
repo TIDAK memperbaiki produksi — server disunting langsung, `.env` lama
dicadangkan lebih dulu, lalu `docker compose up -d backend` supaya kontainer
dibuat ulang. Restart biasa tidak cukup: env dibaca saat kontainer dibuat.

---

## 2026-08-11 · Kuota AI diperketat: 20/hari, 120/bulan, 5/hari khusus carousel

**Pemicunya** pertanyaan Owner: bisakah pembuatan gambar carousel dibatasi per
user per hari, untuk menghemat token?

**Yang ditemukan saat mengukur.** Carousel BUKAN endpoint yang mahal. Diukur
dengan prompt sungguhan di `gemini-3.5-flash`:

| Panggilan | Token (masuk → keluar) | Biaya ≈ |
|---|---|---|
| Carousel 4 slide | 361 → 540 | Rp 88 |
| Carousel 10 slide | 364 → 1.141 | Rp 176 |
| Konten Promosi | 345 → 514 | Rp 84 |

Membatasi carousel saja hampir tidak menggeser tagihan. Yang menggeser tagihan
adalah **batas harian 50** yang berlaku sejak Fase 5: pada Rp 88 per panggilan
itu ~Rp 132.000 sebulan untuk SATU user — lebih besar daripada harga lifetime
yang ia bayar sekali, dan berulang tiap bulan selamanya.

**Keputusan.**

| Batas | Sebelum | Sekarang | Alasan |
|---|---|---|---|
| Semua AI / hari | 50 | **20** | Cukup untuk pembeli baru menjelajah sepuluh tab di hari pertama |
| Semua AI / bulan | tidak ada | **120** | Yang benar-benar menjaga biaya; batas harian saja mengizinkan ~600/bulan |
| `carousel-content` / hari | tidak ada | **5** | Satu postingan = satu panggilan, plus dua-tiga kali ulang sampai kalimatnya disukai |
| Burst | 10/menit | tetap | Sudah pas untuk menahan klik ganda |

**Kenapa batas bulanan, bukan sekadar harian yang lebih kecil.** Yang membakar
uang bukan satu hari sibuk, melainkan pemakaian penuh yang diulang tiap hari.
Batas harian saja tidak pernah menutup itu.

**Kenapa carousel tetap dibatasi tersendiri** walau biayanya setara caption: ia
satu-satunya alat yang keluarannya berupa berkas siap posting, jadi ia yang
paling menggoda ditekan berulang-ulang sampai kata-katanya pas. Tab 9 dan Tab
10 memakai endpoint yang SAMA, jadi keduanya menarik dari jatah yang sama.

**Kenapa tidak lebih ketat lagi.** Pembeli yang membayar Rp 249.000 lalu mentok
di sore hari pertama adalah permintaan refund, dan itu lebih mahal daripada
tokennya. Angka-angka ini menahan ekor sebaran, bukan menghukum pemakaian
wajar.

**Angkanya belum berdasar perilaku nyata.** Saat ini produksi baru berisi 2 user
dan 22 panggilan, dan hari tersibuk (19 panggilan) adalah pengujian Owner
sendiri. Semua angka di atas hasil penalaran, bukan pengukuran — PRD §8.3
memang meminta ditinjau ulang setelah ada data nyata dua minggu.

**Bentuk teknisnya.** Kuota bulanan dijumlahkan dari `DailyQuota` (paling
banyak 31 baris per user), dan kuota per alat dihitung dari `UsageLog`.
Keduanya sengaja TANPA tabel penghitung baru: tabel kedua berarti dua tempat
yang harus selalu sepakat, dan keduanya bisa melenceng tanpa ada yang tahu.
Tidak ada migrasi.

Pemeriksaannya berurutan dari yang paling sempit ke paling luas, supaya pesan
yang diterima user adalah yang paling bisa ditindaklanjuti: "jatah carousel
habis, alat lain masih bisa dipakai" lebih berguna daripada "kuota harian
habis" kalau memang alat lain masih bisa. Header `X-Sisa-Kuota` juga memakai
batas yang paling ketat — angka yang berbohong lebih buruk daripada tidak ada
angka.

**Catatan operasional.** `.env` server sudah disetel langsung (20/120/5);
`deploy.sh` tidak pernah mengirim `.env`. Nilai lama `DAILY_AI_QUOTA=50` ada di
sana secara eksplisit, jadi mengubah bawaan di kode saja tidak akan berpengaruh
di produksi.

**Yang belum dikerjakan.** `gemini-3.1-flash-lite` berharga $0,25/$1,50 per 1 juta
token — satu carousel turun dari ~Rp 88 jadi ~Rp 15, sekitar 6x lebih murah, dan
tercepat saat diuji (0,9 detik). Belum dipakai karena mutu tulisannya di bawah
tier flash, dan tulisan itu justru produknya. Jalan tengah yang masuk akal:
flash-lite untuk Tab 9/10 (teks carousel pendek dan berpola), `gemini-3.5-flash`
tetap untuk Tab 7 yang butuh mengarang menu baru. Perlu keputusan Owner.

---

## 2026-08-11 · Kredensial dikirim lewat SMTP bawaan Django, bukan SDK penyedia

**Keputusan.** Webhook mengirim email berisi kata sandi awal begitu akun dibuat,
memakai `django.core.mail` lewat SMTP. Tidak ada paket baru.

**Kenapa ini yang dikerjakan.** Ini penghalang nomor satu di
`docs/PRODUKSI.md` §6.1: webhook membuat akun lalu mengembalikan kata sandi di
dalam respons HTTP ke affiliate.id, dan tidak ada satu baris pun yang
mengirimkannya ke pembelinya. Orang bayar → akun jadi → tidak pernah tahu kata
sandinya → tidak bisa masuk. Seluruh pekerjaan lain berdiri di belakang pintu
itu.

**Kenapa SMTP, bukan SDK Resend/Brevo.** Keduanya menyediakan SMTP. Memakainya
berarti berpindah penyedia cukup mengganti empat baris `.env`, tanpa menyentuh
kode dan tanpa satu pun dependency baru yang harus diikuti versinya selamanya.
Yang dikirim cuma satu email teks — kemudahan SDK tidak sepadan dengan
ketergantungannya.

**Email teks biasa, bukan HTML.** Yang dikirim cuma alamat masuk, email, dan
kata sandi. HTML tidak menambah kejelasan, tapi menambah kemungkinan tersaring
sebagai spam — tepat pada satu email yang paling tidak boleh hilang.

**Dikirim lewat `transaction.on_commit`.** Kalau dikirim di dalam transaksi,
kegagalan sesudahnya membatalkan akunnya tapi tidak bisa menarik kembali email
yang sudah meluncur: pembeli memegang kata sandi untuk akun yang tidak ada.
Konsekuensinya di test, callback itu tidak jalan sendiri karena test dibungkus
transaksi yang selalu di-rollback — dipakai fixture `django_capture_on_commit_callbacks`,
yang sekaligus membuktikan callback-nya memang terdaftar.

**Gagal kirim TIDAK menggagalkan pembuatan akun.** Pembelinya sudah membayar,
dan akun yang batal dibuat jauh lebih sulit diperbaiki daripada email yang perlu
dikirim ulang. Yang gagal ditandai lewat `kredensial_terkirim_at` yang tetap
kosong, dan panel menghitungnya di kotak tersendiri supaya tidak lewat
diam-diam.

**Tombol panel menggabungkan reset + kirim.** Yang dibutuhkan operasional saat
pembeli menelepon bukan dua langkah terpisah, melainkan pembeli itu bisa masuk.
Memisahkannya cuma menyediakan satu langkah untuk dilupakan, dan yang terlupa
selalu langkah kedua. Kalau emailnya gagal, kata sandinya dikembalikan ke layar
supaya bisa dikirim manual — menyembunyikannya berarti akunnya terkunci untuk
semua orang, termasuk pemiliknya.

**Yang belum, dan ini penting.** `EMAIL_HOST` di `.env` server masih kosong,
jadi email masih dicetak ke log dan **pembeli belum menerima apa pun**. Mengisi
kredensial SMTP penyedia adalah langkah Owner berikutnya.

**Yang sengaja dibiarkan.** Respons webhook masih memuat `kata_sandi_awal`.
Sekarang ia berlebihan dan idealnya dihapus — kata sandi pembeli tidak ada
urusannya dengan penyedia pembayaran. Ditunda supaya penambal manual tetap
bekerja sampai pengiriman email terbukti jalan di produksi; menghapusnya
sekarang berarti mengubah dua hal sekaligus, dan kalau ada yang salah tidak
jelas yang mana.
