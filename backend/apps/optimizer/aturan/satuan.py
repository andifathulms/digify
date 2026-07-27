"""Satuan dapur dan cara membaca angka gaya Indonesia.

Dipakai parser bahan di Tab 1. Ditulis terpisah supaya daftar satuannya bisa
ditambah tanpa menyentuh logika penguraiannya.
"""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

# Tiga jenis satuan yang tidak bisa saling dikonversi. Gram tidak bisa jadi
# mililiter tanpa tahu massa jenis bahannya, dan menebaknya berarti mengarang
# angka biaya.
BERAT = "berat"
VOLUME = "volume"
HITUNGAN = "hitungan"

# nama satuan → (jenis, berapa satuan dasar, nama tampilan)
# Satuan dasar: gram untuk berat, mililiter untuk volume, buah untuk hitungan.
SATUAN: dict[str, tuple[str, Decimal, str]] = {
    # --- Berat (dasar: gram) ---
    "g": (BERAT, Decimal(1), "gram"),
    "gr": (BERAT, Decimal(1), "gram"),
    "gram": (BERAT, Decimal(1), "gram"),
    "grm": (BERAT, Decimal(1), "gram"),
    "ons": (BERAT, Decimal(100), "gram"),
    "kg": (BERAT, Decimal(1000), "gram"),
    "kilo": (BERAT, Decimal(1000), "gram"),
    "kilogram": (BERAT, Decimal(1000), "gram"),
    # --- Volume (dasar: mililiter) ---
    "ml": (VOLUME, Decimal(1), "ml"),
    "mili": (VOLUME, Decimal(1), "ml"),
    "mililiter": (VOLUME, Decimal(1), "ml"),
    "cc": (VOLUME, Decimal(1), "ml"),
    "l": (VOLUME, Decimal(1000), "ml"),
    "ltr": (VOLUME, Decimal(1000), "ml"),
    "liter": (VOLUME, Decimal(1000), "ml"),
    # Takaran dapur — perkiraan yang lazim dipakai resep Indonesia.
    "sdm": (VOLUME, Decimal(15), "ml"),
    "sdt": (VOLUME, Decimal(5), "ml"),
    "gelas": (VOLUME, Decimal(240), "ml"),
    # --- Hitungan (dasar: buah) ---
    "butir": (HITUNGAN, Decimal(1), "butir"),
    "buah": (HITUNGAN, Decimal(1), "buah"),
    "biji": (HITUNGAN, Decimal(1), "biji"),
    "pcs": (HITUNGAN, Decimal(1), "buah"),
    "potong": (HITUNGAN, Decimal(1), "potong"),
    "lembar": (HITUNGAN, Decimal(1), "lembar"),
    "ikat": (HITUNGAN, Decimal(1), "ikat"),
    "siung": (HITUNGAN, Decimal(1), "siung"),
    "batang": (HITUNGAN, Decimal(1), "batang"),
    "bungkus": (HITUNGAN, Decimal(1), "bungkus"),
    "sachet": (HITUNGAN, Decimal(1), "sachet"),
    "papan": (HITUNGAN, Decimal(1), "papan"),
    "porsi": (HITUNGAN, Decimal(1), "porsi"),
}

# Diurut dari yang terpanjang supaya "kilogram" tidak keburu cocok dengan "kg",
# dan "mililiter" tidak cocok dengan "ml".
NAMA_SATUAN_URUT = sorted(SATUAN, key=len, reverse=True)

POLA_SATUAN = "|".join(re.escape(nama) for nama in NAMA_SATUAN_URUT)


def jenis_satuan(nama: str) -> str | None:
    entri = SATUAN.get(nama.strip().lower())
    return entri[0] if entri else None


def ke_satuan_dasar(jumlah: Decimal, nama: str) -> Decimal | None:
    """Ubah jumlah ke satuan dasar jenisnya (gram / ml / buah)."""
    entri = SATUAN.get(nama.strip().lower())
    return jumlah * entri[1] if entri else None


def nama_tampilan(nama: str) -> str:
    entri = SATUAN.get(nama.strip().lower())
    return entri[2] if entri else nama.strip().lower()


def baca_angka(teks: str) -> Decimal | None:
    """Baca angka gaya Indonesia: titik pemisah ribuan, koma pemisah desimal.

        "8.000"  → 8000
        "8000"   → 8000
        "2,5"    → 2.5
        "1.250,5"→ 1250.5

    Titik hanya dianggap pemisah ribuan kalau diikuti tepat tiga angka.
    Tanpa aturan itu, "2.5" (yang dimaksud dua setengah) terbaca 25.
    """
    bersih = teks.strip().replace(" ", "")
    if not bersih:
        return None

    bersih = re.sub(r"\.(?=\d{3}(?:\D|$))", "", bersih)
    bersih = bersih.replace(",", ".")

    try:
        return Decimal(bersih)
    except InvalidOperation:
        return None
