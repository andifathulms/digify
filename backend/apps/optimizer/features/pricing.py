"""Fitur Tab 2 · Harga Jual — seluruhnya aturan sendiri, TANPA AI.

Setiap keluaran di sini punya rumus pasti, dan rumus pasti tidak pantas
diserahkan ke model bahasa: angkanya dipakai pemilik warung untuk mengambil
keputusan uang, dan harus keluar sama persis setiap kali dihitung ulang.

Aturannya ditulis eksplisit supaya bisa dijelaskan ke pemilik warung kalau ia
bertanya "kenapa harganya segini?".
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from apps.optimizer.features.hitungan import (
    break_even_delivery,
    break_even_dine_in,
    bulatkan_ke_atas,
    harga_dari_margin,
    margin_persen,
)

# Harga dibulatkan ke kelipatan 500 — tidak ada warung yang memasang harga
# Rp 24.387.
KELIPATAN_HARGA = 500

# Kalau harga kompetitor lebih tinggi dari harga target kita, kita naik
# SEBAGIAN ke arah sana, bukan langsung menyamai. Menyamai persis berarti
# bertaruh bahwa warung sebelah sudah menghitung dengan benar — belum tentu.
BOBOT_KOMPETITOR = Decimal("0.5")


def _harga_psikologis(harga_rekomendasi: int, batas_bawah: int) -> int:
    """Harga yang terasa lebih murah tanpa kehilangan banyak untung.

    Kebiasaan warung Indonesia: Rp 24.500 terasa lebih murah daripada
    Rp 25.000, sementara Rp 24.999 terasa seperti minimarket, bukan warung.

    Aturannya: kalau harga jatuh tepat di kelipatan ribuan, turunkan 500.
    Kalau sudah berakhiran 500, biarkan — sudah terasa "tidak bulat".
    Tidak pernah turun sampai di bawah titik impas.
    """
    psikologis = harga_rekomendasi - 500 if harga_rekomendasi % 1000 == 0 else harga_rekomendasi
    return max(psikologis, batas_bawah)


def tentukan_harga(data: dict[str, Any]) -> dict[str, Any]:
    cogs = data["cogs"]
    komisi = data["platformFeePercent"]
    harga_kompetitor = data["competitorPrice"] or 0

    # 1. Titik impas — di bawah ini pasti rugi.
    impas_dine_in = break_even_dine_in(cogs)
    impas_delivery = break_even_delivery(cogs, komisi)

    # 2. Harga dasar dari target margin yang diminta pengguna.
    dasar = harga_dari_margin(cogs, data["targetMargin"])

    # 3. Kompetitor hanya dipakai untuk MENAIKKAN, tidak pernah menurunkan.
    #    Kalau warung sebelah menjual lebih murah dari biaya kita, mengikutinya
    #    berarti ikut rugi — dan justru itu masalah yang produk ini mau
    #    selesaikan (PRD §1).
    if harga_kompetitor > dasar:
        dasar += (Decimal(str(harga_kompetitor)) - dasar) * BOBOT_KOMPETITOR

    dine_in = bulatkan_ke_atas(dasar, KELIPATAN_HARGA)

    # 4. Harga ojol: dilebihkan supaya setelah dipotong komisi, untung
    #    bersihnya setara jualan di tempat.
    delivery = bulatkan_ke_atas(harga_dari_margin(dine_in, komisi), KELIPATAN_HARGA)

    return {
        "item_name": data["itemName"],
        "dine_in_recommended": dine_in,
        "delivery_recommended": delivery,
        "psychological_price": _harga_psikologis(dine_in, impas_dine_in),
        "margin_at_recommended": margin_persen(dine_in, cogs),
        "break_even_dine_in": impas_dine_in,
        "break_even_delivery": impas_delivery,
    }
