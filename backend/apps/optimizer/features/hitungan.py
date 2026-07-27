"""Hitungan murni yang tidak boleh diserahkan ke AI.

Model bahasa pandai memberi saran, tapi tidak bisa dijamin konsisten dalam
aritmetika. Angka yang punya rumus pasti dihitung di sini, lalu hasilnya
menimpa apa pun yang dikembalikan model. Fungsi di file ini tanpa efek
samping supaya bisa dites tanpa menyentuh Gemini.

Rupiah tidak punya sen di produk ini: pembulatan ke rupiah penuh dilakukan
di batas, saat nilai keluar dari modul ini.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal, InvalidOperation


def _desimal(nilai: float | int | str | Decimal) -> Decimal:
    try:
        return Decimal(str(nilai))
    except (InvalidOperation, ValueError):
        return Decimal("0")


def bulatkan_rupiah(nilai: float | int | Decimal) -> int:
    """Bulatkan ke rupiah penuh. Rp 12.500,4 → 12500."""
    return int(_desimal(nilai).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def break_even_dine_in(cogs: float) -> int:
    """Titik impas dine-in = biaya bahannya sendiri, tidak ada potongan pihak lain."""
    return bulatkan_rupiah(max(_desimal(cogs), Decimal("0")))


def break_even_delivery(cogs: float, platform_fee_percent: float) -> int:
    """Titik impas delivery = cogs / (1 - komisi).

    Ini nilai unik produk: menjual di ojol dengan harga dine-in berarti komisi
    memakan margin diam-diam. Komisi >= 100% mustahil dan dianggap 0 supaya
    tidak ada pembagian dengan nol atau harga minus.
    """
    komisi = _desimal(platform_fee_percent) / Decimal("100")
    if komisi >= Decimal("1") or komisi < Decimal("0"):
        komisi = Decimal("0")
    return bulatkan_rupiah(_desimal(cogs) / (Decimal("1") - komisi))


def margin_persen(harga: float, cogs: float) -> float:
    """Margin = (harga - cogs) / harga x 100. Harga 0 berarti margin 0, bukan error."""
    harga_d = _desimal(harga)
    if harga_d <= 0:
        return 0.0
    margin = (harga_d - _desimal(cogs)) / harga_d * Decimal("100")
    return float(margin.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def profit_mingguan(harga: float, cogs: float, terjual_per_minggu: float) -> int:
    """Kontribusi profit satu menu dalam seminggu — dasar ranking Tab 3."""
    return bulatkan_rupiah((_desimal(harga) - _desimal(cogs)) * _desimal(terjual_per_minggu))
