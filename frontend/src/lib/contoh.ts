/**
 * Data contoh untuk prefill semua form.
 *
 * Ini aturan produk, bukan hiasan (CLAUDE.md §7): user klik → lihat hasil →
 * baru mengganti dengan data warungnya sendiri. Warung Pak Budi dan menunya
 * dipakai konsisten di seluruh tab supaya terasa satu warung yang sama.
 */

export const NAMA_WARUNG = "Warung Pak Budi";
export const MENU_UTAMA = "Nasi Goreng Spesial";
export const MENU_MINUMAN = "Es Kopi Susu Gula Aren";

/**
 * Takaran untuk SATU porsi, bukan untuk sepanci.
 *
 * Alat Biaya Menu membaca angkanya apa adanya supaya hasilnya bisa dihitung
 * ulang pemilik warung dengan kalkulator sendiri. Jadi contohnya harus benar
 * secara porsi — 500g beras itu tiga sampai empat piring, dan kalau dipakai
 * sebagai contoh, angka biaya yang muncul pertama kali jadi menyesatkan.
 */
export const CONTOH_BAHAN = `- Beras 150g @ Rp 8.000/kg
- Telur 1 butir @ Rp 2.500/butir
- Ayam suwir 70g @ Rp 38.000/kg
- Bawang merah 10g @ Rp 40.000/kg
- Bawang putih 5g @ Rp 35.000/kg
- Kecap manis 15ml @ Rp 25.000/liter
- Minyak goreng 15ml @ Rp 18.000/liter
- Cabai rawit 8g @ Rp 60.000/kg
- Daun bawang 5g @ Rp 30.000/kg`;

export const CONTOH_MENU = [
  { name: MENU_UTAMA, cogs: 8500, price: 25000, weeklySales: 70 },
  { name: MENU_MINUMAN, cogs: 6000, price: 18000, weeklySales: 120 },
  { name: "Mie Goreng Jawa", cogs: 7000, price: 20000, weeklySales: 45 },
  { name: "Ayam Geprek Sambal Bawang", cogs: 12000, price: 22000, weeklySales: 60 },
  { name: "Es Teh Manis", cogs: 1500, price: 5000, weeklySales: 200 },
] as const;

export const CONTOH_BAHAN_WASTE = [
  {
    nama: "Daun bawang",
    jumlahBeli: 1000,
    satuan: "gram",
    hargaSatuan: 30,
    jumlahTerbuang: 300,
    penyebab: "Layu, disimpan di suhu ruang",
  },
  {
    nama: "Daging ayam",
    jumlahBeli: 5000,
    satuan: "gram",
    hargaSatuan: 38,
    jumlahTerbuang: 250,
    penyebab: "",
  },
  {
    nama: "Cabai rawit",
    jumlahBeli: 2000,
    satuan: "gram",
    hargaSatuan: 60,
    jumlahTerbuang: 180,
    penyebab: "Busuk sebelum sempat dipakai",
  },
] as const;

export const CONTOH_KEUNGGULAN =
  "Gula aren asli dari Jawa, kopi dari petani lokal, susunya segar dan tidak terlalu manis";

export const CONTOH_KONDISI =
  "Sore hari sepi pembeli, menu minuman masih sedikit, banyak pelanggan minta camilan";

export const CONTOH_TARGET_PELANGGAN =
  "Pelajar dan pekerja kantoran di sekitar warung, usia 17–35 tahun";

/**
 * Contoh slide carousel yang sudah jadi, dipakai Tab 10.
 *
 * Bukan hasil panggilan AI dan tidak pernah dikirim ke backend: ini bacaan,
 * ditaruh DI ATAS form supaya orang melihat wujud barang jadinya sebelum
 * menunggu 10–30 detik untuk sesuatu yang belum pernah ia lihat. Tab 10 adalah
 * satu-satunya alat yang keluarannya berupa berkas, dan sampai contohnya
 * tampil, "gambar siap posting" cuma janji di dalam kalimat.
 *
 * Menunya sengaja sama dengan yang terisi di form (MENU_MINUMAN) supaya terasa
 * satu warung yang sama, dan jumlahnya empat — sama dengan bawaan "Berapa
 * slide?" — supaya yang dilihat memang yang akan ia dapat.
 */
export const CONTOH_SLIDE_CAROUSEL: {
  nomor_slide: number;
  tipe_slide: string;
  teks_slide: string;
  petunjuk_foto: string;
}[] = [
  {
    nomor_slide: 1,
    tipe_slide: "Pembuka",
    teks_slide: "Es Kopi Susu Gula Aren, Rp 18.000 yang bikin balik lagi",
    petunjuk_foto: "Foto gelasnya dari dekat, ambil saat lapisan gula arennya masih terlihat.",
  },
  {
    nomor_slide: 2,
    tipe_slide: "Alasannya",
    teks_slide: "Gula arennya asli dari Jawa, bukan sirup manis biasa",
    petunjuk_foto: "Foto gula aren batangan sebelum diseduh.",
  },
  {
    nomor_slide: 3,
    tipe_slide: "Buktinya",
    teks_slide: "Kopinya dari petani lokal, digiling tiap pagi sebelum buka",
    petunjuk_foto: "Foto biji kopi atau proses menggiling di pagi hari.",
  },
  {
    nomor_slide: 4,
    tipe_slide: "Ajakan",
    teks_slide: "Mampir hari ini, buka tiap hari jam 07.00–22.00",
    petunjuk_foto: "Foto depan warung supaya orang tahu tempatnya.",
  },
];

export const PLATFORM = ["Instagram", "TikTok", "Facebook", "WhatsApp Status"] as const;

export const GAYA_BAHASA = [
  "Santai dan ramah",
  "Lucu dan menghibur",
  "Sopan dan meyakinkan",
  "Singkat dan langsung",
] as const;
