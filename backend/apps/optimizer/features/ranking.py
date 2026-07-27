"""Fitur Tab 3 · Ranking Profitabilitas — seluruhnya aturan sendiri, TANPA AI.

Ranking berdasar kontribusi profit mingguan, bukan margin atau volume semata:
menu bermargin tipis tapi laris bisa lebih berharga daripada menu bermargin
tebal yang jarang laku.

Status ditentukan oleh MARGIN, bukan volume. Alasannya menyangkut arti ketiga
status itu sendiri — masing-masing memetakan ke satu tindakan:

    GREEN  → pertahankan & promosikan
    YELLOW → perbaiki harganya
    RED    → tinjau ulang atau hentikan

Menu bermargin sehat yang jarang laku BUKAN masalah harga; menyuruh pemiliknya
"perbaiki harga" justru saran yang salah. Yang ia butuhkan promosi — jadi menu
seperti itu tetap GREEN, dan volumenya yang menentukan kalimat aksinya.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from apps.optimizer.features.hitungan import (
    break_even_dine_in,
    bulatkan_ke_atas,
    harga_dari_margin,
    margin_persen,
    profit_mingguan,
)

# Di bawah ini harga sudah terlalu dekat dengan modal — sedikit saja harga
# bahan naik, menunya langsung rugi.
AMBANG_MARGIN_RUGI = 20.0

# Di bawah ini masih untung, tapi tipis. Umumnya bisa diperbaiki lewat harga.
AMBANG_MARGIN_SEHAT = 40.0

# Target margin yang dituju saat menyarankan harga baru.
TARGET_MARGIN_PERBAIKAN = 60.0

# Kenaikan harga paling banyak 20% dalam satu langkah.
#
# Tanpa batas ini, menu yang dijual rugi bisa mendapat saran "naikkan dari
# Rp 20.000 jadi Rp 55.000" — benar secara hitungan, tapi tidak ada pembeli
# yang mau, jadi sarannya tidak bisa dikerjakan. Lebih baik satu langkah yang
# benar-benar dijalankan daripada angka ideal yang cuma dibaca lalu diabaikan.
KENAIKAN_MAKS = 0.20

KELIPATAN_HARGA = 500


def _angka(nilai: float) -> str:
    """Format ribuan gaya Indonesia: 1234567 → "1.234.567".

    Diformat per angka, TIDAK dengan mengganti semua koma di kalimat jadi
    titik — kalimatnya sendiri berisi koma ("Untungnya 25%, masih tipis"),
    dan penggantian menyeluruh akan merusaknya jadi "Untungnya 25%. masih
    tipis".
    """
    return f"{int(round(nilai)):,}".replace(",", ".")


def _harga_saran(cogs: float, harga_sekarang: float) -> int:
    """Harga berikutnya yang realistis, bukan harga ideal yang mustahil dijual.

    Diambil yang paling kecil antara harga ideal (margin 60%) dan kenaikan
    maksimum satu langkah. Tetap dijaga di atas modal — kalau tidak, "sarannya"
    tetap jual rugi.
    """
    ideal = harga_dari_margin(cogs, TARGET_MARGIN_PERBAIKAN)
    batas_langkah = Decimal(str(harga_sekarang)) * (Decimal("1") + Decimal(str(KENAIKAN_MAKS)))
    # Minimal 10% di atas modal, supaya tidak menyarankan harga yang masih rugi
    # hanya karena kenaikannya dibatasi.
    minimal = Decimal(str(cogs)) * Decimal("1.1")

    saran = min(ideal, max(batas_langkah, minimal))
    return bulatkan_ke_atas(max(saran, minimal), KELIPATAN_HARGA)


def _status(margin: float, profit: int) -> str:
    if profit <= 0 or margin < AMBANG_MARGIN_RUGI:
        return "RED"
    if margin < AMBANG_MARGIN_SEHAT:
        return "YELLOW"
    return "GREEN"


def _aksi(
    *,
    status: str,
    peringkat: int,
    cogs: float,
    harga: float,
    terjual: float,
    margin: float,
    profit: int,
    terjual_rata2: float,
) -> str:
    """Satu kalimat aksi berisi angka nyata.

    Kalimatnya template, tapi angkanya dihitung dari data menu itu sendiri —
    jadi tetap spesifik dan bisa langsung dikerjakan besok pagi (PRD §3.2).
    """
    saran = _harga_saran(cogs, harga)
    impas = break_even_dine_in(cogs)
    tambahan = max(0, saran - harga) * terjual
    margin_baru = margin_persen(saran, cogs)

    # Kalau satu langkah kenaikan belum cukup menyehatkan marginnya, katakan
    # apa adanya. Menjanjikan menu ini beres setelah satu kali naik harga
    # padahal belum, membuat pemiliknya berhenti memantau.
    lanjutan = (
        " Tinjau lagi setelah dua minggu — mungkin perlu satu kali naik lagi."
        if margin_baru < AMBANG_MARGIN_SEHAT
        else ""
    )

    if status == "RED":
        if profit <= 0:
            rugi = abs(harga - cogs)
            return (
                f"Tiap porsi rugi Rp {_angka(rugi)}. Balik modal butuh harga "
                f"Rp {_angka(impas)}. Coba naikkan dulu ke Rp {_angka(saran)}; kalau "
                f"pembeli tidak mau di harga itu, kurangi porsinya atau hentikan menu ini."
            )
        return (
            f"Untungnya cuma {margin:.0f}% — terlalu dekat dengan modal. Naikkan ke "
            f"Rp {_angka(saran)} (untung jadi {margin_baru:.0f}%), atau kurangi porsi "
            f"supaya modalnya turun.{lanjutan}"
        )

    if status == "YELLOW":
        return (
            f"Untungnya {margin:.0f}%, masih tipis. Coba harga Rp {_angka(saran)} selama "
            f"dua minggu — untung jadi {margin_baru:.0f}%, kira-kira menambah "
            f"Rp {_angka(tambahan)} seminggu.{lanjutan}"
        )

    if peringkat == 1:
        return (
            "Penyumbang profit terbesar warung Anda. Pertahankan harganya, dan pastikan "
            "bahannya tidak pernah habis di jam ramai."
        )

    if terjual >= terjual_rata2:
        return (
            f"Sudah laku {_angka(terjual)} porsi seminggu dengan untung sehat "
            f"({margin:.0f}%). Pertahankan harga, jaga rasanya tetap sama."
        )

    naik_10 = (harga - cogs) * 10
    return (
        f"Untungnya sehat ({margin:.0f}%) tapi baru laku {_angka(terjual)} porsi seminggu. "
        f"Tawarkan ke tiap pembeli — tiap tambahan 10 porsi menambah sekitar "
        f"Rp {_angka(naik_10)} seminggu."
    )


def ranking_profitabilitas(data: dict[str, Any]) -> dict[str, Any]:
    menu_items = data["menuItems"]

    dihitung = [
        {
            "item": item["name"],
            "cogs": item["cogs"],
            "price": item["price"],
            "terjual": item["weeklySales"],
            "weekly_profit": profit_mingguan(item["price"], item["cogs"], item["weeklySales"]),
            "margin_percentage": margin_persen(item["price"], item["cogs"]),
        }
        for item in menu_items
    ]

    # Urutkan dari penyumbang profit mingguan terbesar — inti Tab 3.
    dihitung.sort(key=lambda baris: baris["weekly_profit"], reverse=True)

    terjual_rata2 = sum(baris["terjual"] for baris in dihitung) / len(dihitung) if dihitung else 0

    rankings: list[dict[str, Any]] = []
    for nomor, baris in enumerate(dihitung, start=1):
        status = _status(baris["margin_percentage"], baris["weekly_profit"])
        rankings.append(
            {
                "rank": nomor,
                "item": baris["item"],
                "weekly_profit": baris["weekly_profit"],
                "margin_percentage": baris["margin_percentage"],
                "status": status,
                "action": _aksi(
                    status=status,
                    peringkat=nomor,
                    cogs=baris["cogs"],
                    harga=baris["price"],
                    terjual=baris["terjual"],
                    margin=baris["margin_percentage"],
                    profit=baris["weekly_profit"],
                    terjual_rata2=terjual_rata2,
                ),
            }
        )

    return {
        "rankings": rankings,
        "total_weekly_profit": sum(baris["weekly_profit"] for baris in rankings),
        "items_to_promote": sum(1 for baris in rankings if baris["status"] == "GREEN"),
        "items_to_reprice": sum(1 for baris in rankings if baris["status"] == "YELLOW"),
        "items_to_remove": sum(1 for baris in rankings if baris["status"] == "RED"),
    }
