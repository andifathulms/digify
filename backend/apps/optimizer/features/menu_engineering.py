"""Fitur Tab 4 · Optimasi Menu — seluruhnya aturan sendiri, TANPA AI.

Memakai matriks menu engineering (Kasavana–Smith), metode baku yang sudah
dipakai puluhan tahun di industri restoran. Dua sumbu:

    Laris?  → jumlah terjual dibanding rata-rata
    Untung? → untung per porsi dibanding rata-rata

    Laris + untung tebal  → BINTANG    → dorong lebih keras
    Laris + untung tipis  → KUDA BEBAN → perbaiki harganya
    Sepi  + untung tebal  → TEKA-TEKI  → jual sepaket dengan yang laris
    Sepi  + untung tipis  → ANJING     → pertimbangkan dihentikan

Kenapa aturan lebih pantas dari AI di sini: metodenya memang sudah baku dan
bisa diperiksa. Kalau pemilik warung bertanya "kenapa menu ini disuruh
dihentikan?", jawabannya bisa ditunjuk angkanya, bukan "karena AI bilang".

Ambang laris memakai 70% dari rata-rata, bukan 100%. Ini bagian dari metode
aslinya: dengan 10 menu, hampir separuhnya pasti di bawah rata-rata semata
karena aritmetika, dan menghukum menu yang sebenarnya baik-baik saja.
"""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

from apps.optimizer.features.hitungan import (
    bulatkan_ke_atas,
    bulatkan_rupiah,
    harga_dari_margin,
    margin_persen,
)

logger = logging.getLogger(__name__)

KELOMPOK = ("remove", "promote", "reprice", "bundle")

MINGGU_PER_BULAN = 4
KELIPATAN_HARGA = 500

# Bagian dari rata-rata penjualan yang sudah dianggap "laris" (aturan 70%
# dari metode aslinya).
AMBANG_LARIS = 0.7

# Target margin saat menyarankan harga baru untuk menu bermargin tipis.
TARGET_MARGIN_PERBAIKAN = 60.0
# Kenaikan harga paling banyak per langkah — sama alasannya dengan Tab 3:
# saran yang terlalu jauh tidak akan dijalankan siapa pun.
KENAIKAN_MAKS = 0.20

# Perkiraan kenaikan penjualan kalau menu benar-benar didorong. Sengaja
# konservatif: janji besar yang tidak terbukti membuat pemiliknya berhenti
# percaya pada seluruh laporan.
KENAIKAN_PROMOSI = Decimal("0.15")
KENAIKAN_BUNDLING = Decimal("0.20")


def _angka(nilai: float) -> str:
    return f"{int(round(nilai)):,}".replace(",", ".")


def _harga_saran(cogs: float, harga: float) -> int:
    """Harga baru yang selalu LEBIH TINGGI dari harga sekarang.

    Menu bermodal kecil bisa punya "harga ideal" yang justru di bawah harga
    jualnya sekarang — Es Teh modal Rp 1.500 dijual Rp 5.000 sudah bermargin
    70%, sementara harga ideal di margin 60% cuma Rp 3.750. Tanpa lantai ini,
    alat menyuruh pemiliknya MENURUNKAN harga di kolom "perbaiki harga".

    Menu seperti itu masuk kelompok perbaiki-harga bukan karena persentasenya
    jelek, tapi karena rupiah per porsinya kecil padahal lakunya banyak — dan
    obatnya tetap naik harga, sedikit saja.
    """
    ideal = harga_dari_margin(cogs, TARGET_MARGIN_PERBAIKAN)
    batas = Decimal(str(harga)) * (Decimal("1") + Decimal(str(KENAIKAN_MAKS)))
    minimal = Decimal(str(cogs)) * Decimal("1.1")

    saran = bulatkan_ke_atas(max(min(ideal, max(batas, minimal)), minimal), KELIPATAN_HARGA)
    # Minimal satu langkah harga di atas harga sekarang.
    return max(saran, bulatkan_ke_atas(Decimal(str(harga)) + 1, KELIPATAN_HARGA))


def _siapkan(menu_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Lengkapi tiap menu dengan untung per porsi dan profit bulanannya."""
    return [
        {
            "nama": item["name"],
            "cogs": item["cogs"],
            "harga": item["price"],
            "terjual": item["weeklySales"],
            "untung_porsi": item["price"] - item["cogs"],
            "margin": item.get("margin") or margin_persen(item["price"], item["cogs"]),
            "profit_bulanan": bulatkan_rupiah(
                (item["price"] - item["cogs"]) * item["weeklySales"] * MINGGU_PER_BULAN
            ),
        }
        for item in menu_items
    ]


def _bintang(menu: dict[str, Any], jam_sibuk: str) -> dict[str, Any]:
    dampak = bulatkan_rupiah(Decimal(menu["profit_bulanan"]) * KENAIKAN_PROMOSI)
    di_jam = f" terutama di jam {jam_sibuk}" if jam_sibuk else ""
    return {
        "item": menu["nama"],
        "alasan": (
            f"Laris ({_angka(menu['terjual'])} porsi seminggu) sekaligus untungnya tebal "
            f"(Rp {_angka(menu['untung_porsi'])} per porsi). Menu inilah yang paling "
            f"menghidupi warung Anda."
        ),
        "aksi": (
            f"Taruh di urutan paling atas daftar menu dan tawarkan lebih dulu ke tiap "
            f"pembeli{di_jam}. Pastikan bahannya tidak pernah kehabisan."
        ),
        "estimasi_dampak": dampak,
    }


def _kuda_beban(menu: dict[str, Any]) -> dict[str, Any]:
    saran = _harga_saran(menu["cogs"], menu["harga"])
    dampak = bulatkan_rupiah(max(0, saran - menu["harga"]) * menu["terjual"] * MINGGU_PER_BULAN)
    return {
        "item": menu["nama"],
        "alasan": (
            f"Laris ({_angka(menu['terjual'])} porsi seminggu) tapi untungnya cuma "
            f"Rp {_angka(menu['untung_porsi'])} per porsi. Ramainya tidak sebanding dengan "
            f"hasilnya."
        ),
        "aksi": (
            f"Naikkan harga ke Rp {_angka(saran)} — untung jadi "
            f"{margin_persen(saran, menu['cogs']):.0f}%. Kalau takut pembeli kabur, "
            f"kurangi porsi sedikit dulu sambil menjaga harganya."
        ),
        "estimasi_dampak": dampak,
    }


def _teka_teki(menu: dict[str, Any], pasangan: str | None) -> dict[str, Any]:
    dampak = bulatkan_rupiah(Decimal(menu["profit_bulanan"]) * KENAIKAN_BUNDLING)
    if pasangan:
        item = f"{menu['nama']} + {pasangan}"
        aksi = (
            f"Jual sepaket dengan {pasangan} yang sudah laris, dengan harga paket sedikit "
            f"di bawah harga beli terpisah. Menu ini butuh dilihat orang, bukan diturunkan "
            f"harganya."
        )
    else:
        item = menu["nama"]
        aksi = (
            "Pajang di tempat yang paling mudah dilihat dan sebut namanya waktu pembeli "
            "sedang memilih. Menu ini butuh dilihat orang, bukan diturunkan harganya."
        )

    return {
        "item": item,
        "alasan": (
            f"Untungnya tebal (Rp {_angka(menu['untung_porsi'])} per porsi) tapi baru laku "
            f"{_angka(menu['terjual'])} porsi seminggu. Sayang kalau dibiarkan sepi."
        ),
        "aksi": aksi,
        "estimasi_dampak": dampak,
    }


def _anjing(menu: dict[str, Any]) -> dict[str, Any]:
    # Jujur: menghentikan menu yang masih sedikit untung berarti kehilangan
    # untung itu. Yang benar-benar menambah profit cuma penghentian menu rugi.
    dampak = -menu["profit_bulanan"]
    if menu["untung_porsi"] <= 0:
        alasan = (
            f"Dijual di bawah modal — tiap porsi rugi "
            f"Rp {_angka(abs(menu['untung_porsi']))}, dan cuma laku "
            f"{_angka(menu['terjual'])} porsi seminggu."
        )
    else:
        alasan = (
            f"Jarang laku ({_angka(menu['terjual'])} porsi seminggu) dan untungnya juga "
            f"tipis (Rp {_angka(menu['untung_porsi'])} per porsi). Tempat dan bahannya "
            f"lebih berguna untuk menu lain."
        )

    return {
        "item": menu["nama"],
        "alasan": alasan,
        "aksi": (
            "Hentikan dulu selama dua minggu dan lihat apakah ada yang menanyakannya. "
            "Kalau tidak ada, hapus dari daftar menu."
        ),
        "estimasi_dampak": dampak,
    }


def optimasi_menu(data: dict[str, Any]) -> dict[str, Any]:
    menu_items = data["menuItems"]
    min_items = data["minItems"]
    jam_sibuk = (data.get("peakHours") or "").strip()

    disiapkan = _siapkan(menu_items)

    rata_terjual = sum(m["terjual"] for m in disiapkan) / len(disiapkan)
    rata_untung = sum(m["untung_porsi"] for m in disiapkan) / len(disiapkan)
    batas_laris = rata_terjual * AMBANG_LARIS

    bintang, kuda_beban, teka_teki, anjing = [], [], [], []
    for menu in disiapkan:
        laris = menu["terjual"] >= batas_laris
        untung_tebal = menu["untung_porsi"] >= rata_untung

        if laris and untung_tebal:
            bintang.append(menu)
        elif laris:
            kuda_beban.append(menu)
        elif untung_tebal:
            teka_teki.append(menu)
        else:
            anjing.append(menu)

    # Teka-teki dipasangkan dengan menu paling laris supaya kebagian perhatian.
    terlaris = max(disiapkan, key=lambda m: m["terjual"])["nama"] if disiapkan else None

    kelompok: dict[str, list[dict[str, Any]]] = {
        "promote": [_bintang(m, jam_sibuk) for m in bintang],
        "reprice": [_kuda_beban(m) for m in kuda_beban],
        "bundle": [_teka_teki(m, terlaris if terlaris != m["nama"] else None) for m in teka_teki],
        "remove": [_anjing(m) for m in anjing],
    }

    # Guardrail minItems: warung tanpa menu tidak bisa jualan. Yang disisakan
    # adalah yang paling merugikan, karena itu yang paling layak dihentikan.
    maksimal_dihapus = max(0, len(menu_items) - min_items)
    if len(kelompok["remove"]) > maksimal_dihapus:
        logger.info(
            "Saran penghentian dipangkas dari %s jadi %s (minimum %s menu).",
            len(kelompok["remove"]),
            maksimal_dihapus,
            min_items,
        )
        kelompok["remove"].sort(key=lambda b: b["estimasi_dampak"], reverse=True)
        kelompok["remove"] = kelompok["remove"][:maksimal_dihapus]

    total = sum(baris["estimasi_dampak"] for nama in KELOMPOK for baris in kelompok[nama])

    return {**kelompok, "total_estimated_impact": total}
