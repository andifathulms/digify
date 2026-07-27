"""Pengetahuan tentang bahan dapur warung Indonesia.

Ini yang sebelumnya dititipkan ke model bahasa: "bahan ini biasanya terbuang
berapa persen, dan kenapa". Ditulis eksplisit di sini supaya jawabannya sama
setiap kali, bisa ditinjau orang yang paham dapur, dan bisa diperbaiki tanpa
menyentuh kode.

Dipakai bersama Tab 1 (perkiraan food waste) dan Tab 6 (dugaan penyebab dan
rekomendasi).

Angka waste-nya perkiraan kasar untuk skala warung, bukan hasil penelitian.
Kalau Owner punya data nyata dari pembeli, angka di sini yang diperbarui —
bukan logikanya.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Kategori:
    nama: str
    # Perkiraan bagian yang terbuang saat persiapan, dalam persen.
    waste_persen: float
    # Dugaan penyebab kalau pengguna tidak menuliskannya sendiri.
    penyebab: str
    # Langkah yang murah dan masuk akal untuk warung kecil.
    saran: str
    kata_kunci: tuple[str, ...] = field(default_factory=tuple)


# Urutan penting: yang lebih spesifik diperiksa lebih dulu. "daun bawang"
# harus kena SAYUR_DAUN, bukan tertangkap kata "bawang" di BUMBU_SEGAR.
KATEGORI: tuple[Kategori, ...] = (
    Kategori(
        nama="Sayur dan daun segar",
        waste_persen=15.0,
        penyebab="Layu atau busuk karena disimpan di suhu ruang terlalu lama.",
        saran=(
            "Simpan sayur dan daun di wadah tertutup di kulkas, dan belanja lebih sering "
            "dalam jumlah kecil daripada sekali banyak."
        ),
        kata_kunci=(
            "daun bawang",
            "daun jeruk",
            "daun salam",
            "seledri",
            "kemangi",
            "bayam",
            "kangkung",
            "sawi",
            "selada",
            "kol",
            "kubis",
            "tauge",
            "toge",
            "timun",
            "mentimun",
            "terong",
            "buncis",
            "wortel",
            "tomat",
            "sayur",
            "daun",
        ),
    ),
    Kategori(
        nama="Cabai dan bumbu segar",
        waste_persen=12.0,
        penyebab="Busuk atau berjamur sebelum sempat terpakai habis.",
        saran=(
            "Cabai dan bumbu segar yang tidak langsung dipakai lebih awet kalau digiling "
            "dulu lalu disimpan beku dalam porsi kecil."
        ),
        kata_kunci=(
            "cabai",
            "cabe",
            "rawit",
            "bawang merah",
            "bawang putih",
            "bawang bombay",
            "bawang",
            "jahe",
            "kunyit",
            "lengkuas",
            "kencur",
            "serai",
            "sereh",
            "kemiri",
        ),
    ),
    Kategori(
        nama="Daging, ayam, dan ikan",
        waste_persen=8.0,
        penyebab="Sisa potongan yang tidak terpakai, atau rusak karena suhu penyimpanan.",
        saran=(
            "Begitu belanja, langsung bagi daging/ayam/ikan ke porsi sekali masak lalu "
            "bekukan. Yang dicairkan berulang kali paling cepat rusak."
        ),
        kata_kunci=(
            "daging",
            "sapi",
            "kambing",
            "ayam",
            "bebek",
            "ikan",
            "lele",
            "nila",
            "tongkol",
            "udang",
            "cumi",
            "seafood",
        ),
    ),
    Kategori(
        nama="Telur dan produk susu",
        waste_persen=5.0,
        penyebab="Pecah saat disimpan, atau lewat tanggal karena jarang dicek.",
        saran=(
            "Taruh telur dan susu yang lebih dulu dibeli di bagian depan rak, supaya yang "
            "lama selalu terpakai duluan."
        ),
        kata_kunci=("telur", "susu", "keju", "mentega", "margarin", "yogurt", "krimer"),
    ),
    Kategori(
        nama="Minyak dan bahan cair",
        waste_persen=4.0,
        penyebab="Tumpah saat menuang, atau tersisa di dasar botol dan wadah.",
        saran=(
            "Pindahkan minyak dan kecap ke botol bermulut kecil atau botol pompa, supaya "
            "takarannya lebih terkontrol dan tidak tumpah."
        ),
        kata_kunci=(
            "minyak",
            "kecap",
            "saus",
            "sambal botol",
            "santan",
            "cuka",
            "sirup",
            "air",
        ),
    ),
    Kategori(
        nama="Bahan kering dan bumbu bubuk",
        waste_persen=2.0,
        penyebab="Tumpah saat menakar, atau menggumpal karena wadahnya tidak rapat.",
        saran=(
            "Pakai sendok takar dan wadah bertutup rapat untuk bahan kering. Menakar "
            "dengan perkiraan tangan adalah sumber boros yang paling tidak terasa."
        ),
        kata_kunci=(
            "beras",
            "tepung",
            "gula",
            "garam",
            "merica",
            "lada",
            "ketumbar",
            "penyedap",
            "micin",
            "mie",
            "bihun",
            "kerupuk",
            "kopi",
            "teh",
            "bumbu",
        ),
    ),
)

# Dipakai kalau nama bahannya tidak dikenali sama sekali.
KATEGORI_LAIN = Kategori(
    nama="Bahan lain",
    waste_persen=5.0,
    penyebab="Belum bisa dipastikan — coba catat penyebabnya sendiri periode depan.",
    saran=(
        "Catat penyebab terbuangnya bahan ini selama seminggu. Sekali penyebabnya "
        "kelihatan, biasanya solusinya jadi jelas dengan sendirinya."
    ),
)


def kategori_bahan(nama: str) -> Kategori:
    """Tebak kategori sebuah bahan dari namanya.

    Pencocokan dilakukan pada nama yang sudah dikecilkan hurufnya, dan kata
    kunci yang lebih panjang diperiksa lebih dulu — supaya "daun bawang" jatuh
    ke sayur, bukan ke bumbu karena mengandung kata "bawang".
    """
    teks = nama.strip().lower()
    if not teks:
        return KATEGORI_LAIN

    cocok: tuple[int, Kategori] | None = None
    for kategori in KATEGORI:
        for kata in kategori.kata_kunci:
            if kata in teks and (cocok is None or len(kata) > cocok[0]):
                cocok = (len(kata), kategori)

    return cocok[1] if cocok else KATEGORI_LAIN
