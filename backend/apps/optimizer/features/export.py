"""Fitur Tab 5 · Laporan Final."""

from __future__ import annotations

from typing import Any

from apps.ai.gemini import call_gemini
from apps.ai.schemas.export import SCHEMA_EXPORT
from apps.optimizer.features.hitungan import bulatkan_rupiah, margin_persen
from apps.optimizer.prompts.export import SYSTEM_EXPORT, prompt_export

# Empat minggu, bukan 30/7 hari. Pemilik warung berpikir dalam minggu, dan
# angka yang bisa dihitung ulang di kepala lebih dipercaya.
MINGGU_PER_BULAN = 4


def _baris_untuk_prompt(menu_items: list[dict[str, Any]]) -> str:
    baris = []
    for item in menu_items:
        margin = item.get("margin") or margin_persen(item["newPrice"], item["cogs"])
        baris.append(
            f"- {item['name']}: biaya bahan Rp {item['cogs']:,.0f}, "
            f"harga lama Rp {item['oldPrice']:,.0f}, harga baru Rp {item['newPrice']:,.0f}, "
            f"margin {margin}%, terjual {item['weeklySales']:,.0f}/minggu"
        )
    return "\n".join(baris)


def _kenaikan_profit_bulanan(menu_items: list[dict[str, Any]]) -> int:
    """Selisih harga x jumlah terjual x 4 minggu. Biaya bahan tidak berubah
    saat harga naik, jadi seluruh selisih harga jadi tambahan profit."""
    total = sum(
        (item["newPrice"] - item["oldPrice"]) * item["weeklySales"] * MINGGU_PER_BULAN
        for item in menu_items
    )
    return bulatkan_rupiah(total)


def laporan_final(data: dict[str, Any]) -> dict[str, Any]:
    menu_items = data["menuItems"]

    hasil = call_gemini(
        system_instruction=SYSTEM_EXPORT,
        user_prompt=prompt_export(
            nama_restoran=data["restaurantName"],
            tanggal=data["date"],
            baris_menu=_baris_untuk_prompt(menu_items),
        ),
        schema=SCHEMA_EXPORT,
        endpoint="export",
    )

    catatan_per_menu = {
        str(baris.get("nama_menu", "")): str(baris.get("catatan", "")).strip()
        for baris in hasil.get("menu_items", [])
        if isinstance(baris, dict)
    }

    # Seluruh kolom angka dibangun ulang dari input. Laporan ini dicetak dan
    # dipakai mengambil keputusan; tidak boleh ada angka karangan model.
    baris_laporan = [
        {
            "nama_menu": item["name"],
            "biaya_bahan": bulatkan_rupiah(item["cogs"]),
            "harga_lama": bulatkan_rupiah(item["oldPrice"]),
            "harga_baru": bulatkan_rupiah(item["newPrice"]),
            "margin": item.get("margin") or margin_persen(item["newPrice"], item["cogs"]),
            "terjual_per_minggu": bulatkan_rupiah(item["weeklySales"]),
            "catatan": catatan_per_menu.get(item["name"], ""),
        }
        for item in menu_items
    ]

    ringkasan_ai = hasil.get("ringkasan") if isinstance(hasil.get("ringkasan"), dict) else {}

    return {
        "nama_restoran": data["restaurantName"],
        "tanggal": data["date"],
        "menu_items": baris_laporan,
        "ringkasan": {
            "total_item": len(menu_items),
            "item_direprice": sum(1 for item in menu_items if item["newPrice"] != item["oldPrice"]),
            "estimasi_kenaikan_profit_bulanan": _kenaikan_profit_bulanan(menu_items),
            "catatan_penutup": str(ringkasan_ai.get("catatan_penutup", "")).strip(),
        },
    }
