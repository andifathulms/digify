"""Fitur Tab 1 · Biaya Menu — seluruhnya aturan sendiri, TANPA AI.

Daftar bahan ditulis bebas oleh pemilik warung dan diuraikan oleh parser di
apps/optimizer/aturan/parser_bahan.py. Perkiraan bahan terbuang diambil dari
tabel kategori bahan, ditimbang menurut besar biayanya.

Daftar bahan dibaca sebagai takaran untuk SATU porsi, persis seperti yang
ditulis. Tidak ada penyesuaian diam-diam terhadap berat porsi: angka biaya
harus bisa dihitung ulang pemilik warung dengan kalkulator di tangannya
sendiri. Kalau angkanya tidak bisa dia buktikan, dia tidak akan memakainya
untuk menentukan harga.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from rest_framework import serializers

from apps.optimizer.aturan.bahan import kategori_bahan
from apps.optimizer.aturan.parser_bahan import BahanTerurai, urai_daftar
from apps.optimizer.features.hitungan import bulatkan_rupiah, margin_persen

# Kalau banyak baris gagal, cukup sebutkan beberapa. Pesan sepanjang layar
# tidak akan dibaca siapa pun.
MAKS_BARIS_DISEBUT = 3


def _pesan_baris_gagal(gagal: list[tuple[str, str]]) -> str:
    """Pesan yang menyebut baris mana yang bermasalah, bukan sekadar "input
    tidak valid"."""
    contoh = "; ".join(f"«{baris}» — {alasan}" for baris, alasan in gagal[:MAKS_BARIS_DISEBUT])
    sisa = len(gagal) - MAKS_BARIS_DISEBUT

    pesan = f"Ada {len(gagal)} baris bahan yang belum bisa dibaca: {contoh}"
    if sisa > 0:
        pesan += f", dan {sisa} baris lainnya"

    return (
        f"{pesan}. Tulis dengan bentuk seperti ini: "
        f"Beras 500g @ Rp 8.000/kg — nama bahan, jumlah dipakai, lalu harga belinya."
    )


def _persen_waste(bahan: list[BahanTerurai], total_biaya: Decimal) -> float:
    """Perkiraan bahan terbuang, ditimbang menurut besar biaya tiap bahan.

    Ditimbang, bukan dirata-rata polos: satu ikat daun bawang yang boros 15%
    tidak boleh menyeret perkiraan seluruh menu, kalau isi biayanya sebenarnya
    didominasi daging.
    """
    if total_biaya <= 0:
        return 0.0

    tertimbang = sum(
        Decimal(str(kategori_bahan(b.nama).waste_persen)) * (b.biaya / total_biaya) for b in bahan
    )
    return float(round(tertimbang, 1))


def hitung_biaya_menu(data: dict[str, Any]) -> dict[str, Any]:
    hasil = urai_daftar(data["ingredientsList"])

    # Baris yang gagal TIDAK diam-diam dianggap nol. Biaya bahan yang kurang
    # hitung membuat pemiliknya mengira menunya untung padahal tidak.
    if hasil.gagal:
        raise serializers.ValidationError(_pesan_baris_gagal(hasil.gagal))

    if not hasil.bahan:
        raise serializers.ValidationError(
            "Daftar bahannya masih kosong. Tulis minimal satu bahan, misalnya: "
            "Beras 500g @ Rp 8.000/kg"
        )

    total_biaya = sum((b.biaya for b in hasil.bahan), Decimal(0))
    cogs = bulatkan_rupiah(total_biaya)
    harga_sekarang = data["currentPrice"]

    return {
        "item_name": data["itemName"],
        "ingredients_breakdown": [
            {
                "nama": b.nama,
                "jumlah": float(round(b.jumlah, 2)),
                "satuan": b.satuan,
                # Dibulatkan 2 angka, bukan ke rupiah penuh: harga per gram
                # sering di bawah Rp 1, dan membulatkannya jadi nol membuat
                # baris struk terlihat gratis.
                "harga_satuan": float(round(b.harga_satuan, 2)),
                "biaya": bulatkan_rupiah(b.biaya),
            }
            for b in hasil.bahan
        ],
        "cogs_per_portion": cogs,
        "current_margin_percentage": margin_persen(harga_sekarang, cogs),
        "food_waste_percentage": _persen_waste(hasil.bahan, total_biaya),
    }
