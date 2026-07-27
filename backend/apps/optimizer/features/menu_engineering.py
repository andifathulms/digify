"""Fitur Tab 4 · Optimasi Menu."""

from __future__ import annotations

import logging
from typing import Any

from apps.ai.gemini import call_gemini
from apps.ai.schemas.menu_engineering import SCHEMA_MENU_ENGINEERING
from apps.optimizer.features.hitungan import bulatkan_rupiah, margin_persen
from apps.optimizer.prompts.menu_engineering import (
    SYSTEM_MENU_ENGINEERING,
    prompt_menu_engineering,
)

logger = logging.getLogger(__name__)

KELOMPOK = ("remove", "promote", "reprice", "bundle")


def _baris_untuk_prompt(menu_items: list[dict[str, Any]]) -> str:
    baris = []
    for item in menu_items:
        margin = item.get("margin") or margin_persen(item["price"], item["cogs"])
        status = f", status {item['status']}" if item.get("status") else ""
        baris.append(
            f"- {item['name']}: biaya bahan Rp {item['cogs']:,.0f}, "
            f"harga Rp {item['price']:,.0f}, margin {margin}%, "
            f"terjual {item['weeklySales']:,.0f}/minggu{status}"
        )
    return "\n".join(baris)


def _bersihkan_kelompok(hasil: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    """Pastikan keempat kelompok selalu ada dan berisi objek yang lengkap."""
    bersih: dict[str, list[dict[str, Any]]] = {}
    for nama in KELOMPOK:
        isi = hasil.get(nama)
        bersih[nama] = [
            {
                "item": str(baris.get("item", "")).strip(),
                "alasan": str(baris.get("alasan", "")).strip(),
                "aksi": str(baris.get("aksi", "")).strip(),
                "estimasi_dampak": bulatkan_rupiah(baris.get("estimasi_dampak") or 0),
            }
            for baris in (isi if isinstance(isi, list) else [])
            if isinstance(baris, dict) and str(baris.get("item", "")).strip()
        ]
    return bersih


def optimasi_menu(data: dict[str, Any]) -> dict[str, Any]:
    menu_items = data["menuItems"]
    min_items = data["minItems"]

    hasil = call_gemini(
        system_instruction=SYSTEM_MENU_ENGINEERING,
        user_prompt=prompt_menu_engineering(
            baris_menu=_baris_untuk_prompt(menu_items),
            min_items=min_items,
            peak_hours=data["peakHours"],
        ),
        schema=SCHEMA_MENU_ENGINEERING,
        endpoint="menu-engineering",
    )

    kelompok = _bersihkan_kelompok(hasil)

    # Guardrail minItems ditegakkan di sini, bukan hanya diminta lewat prompt.
    # Prompt bisa diabaikan model; akibatnya user disuruh menutup warungnya.
    maksimal_dihapus = max(0, len(menu_items) - min_items)
    if len(kelompok["remove"]) > maksimal_dihapus:
        logger.warning(
            "Model menyarankan menghapus %s dari %s menu (minimum %s). Dipangkas.",
            len(kelompok["remove"]),
            len(menu_items),
            min_items,
        )
        # Sisakan yang dampaknya paling besar supaya saran yang dibuang adalah
        # yang paling tidak berarti.
        kelompok["remove"].sort(key=lambda baris: baris["estimasi_dampak"], reverse=True)
        kelompok["remove"] = kelompok["remove"][:maksimal_dihapus]

    total = sum(baris["estimasi_dampak"] for nama in KELOMPOK for baris in kelompok[nama])

    return {**kelompok, "total_estimated_impact": total}
