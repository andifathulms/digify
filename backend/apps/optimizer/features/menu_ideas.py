"""Fitur Tab 7 · AI Menu Ideas."""

from __future__ import annotations

import logging
from typing import Any

from apps.ai.gemini import call_gemini
from apps.ai.schemas.menu_ideas import SCHEMA_MENU_IDEAS
from apps.optimizer.features.hitungan import bulatkan_rupiah, margin_persen
from apps.optimizer.prompts.menu_ideas import SYSTEM_MENU_IDEAS, prompt_menu_ideas

logger = logging.getLogger(__name__)


def _baris_untuk_prompt(existing_menu: list[dict[str, Any]]) -> str:
    return "\n".join(
        f"- {item['name']}: harga Rp {item['price']:,.0f}"
        + (f", margin {item['margin']}%" if item.get("margin") else "")
        for item in existing_menu
    )


def ide_menu(data: dict[str, Any]) -> dict[str, Any]:
    max_cogs = data["maxCogs"]

    hasil = call_gemini(
        system_instruction=SYSTEM_MENU_IDEAS,
        user_prompt=prompt_menu_ideas(
            baris_menu=_baris_untuk_prompt(data["existingMenu"]),
            kondisi=data["kondisi"],
            target_pelanggan=data["targetPelanggan"],
            max_cogs=max_cogs,
            jumlah_ide=data["jumlahIde"],
        ),
        schema=SCHEMA_MENU_IDEAS,
        endpoint="menu-ideas",
    )

    ide_bersih: list[dict[str, Any]] = []
    for ide in hasil.get("ide_menu", []):
        if not isinstance(ide, dict) or not str(ide.get("nama", "")).strip():
            continue

        cogs = bulatkan_rupiah(ide.get("cogs") or 0)

        # Plafon COGS ditegakkan di sini, bukan cuma diminta lewat prompt.
        # Ide yang modalnya di luar jangkauan warung bukan ide, cuma gangguan.
        if cogs > max_cogs:
            logger.info(
                "Ide '%s' dibuang: biaya bahan Rp %s melewati plafon Rp %s.",
                ide.get("nama"),
                cogs,
                max_cogs,
            )
            continue

        harga = bulatkan_rupiah(ide.get("harga") or 0)
        ide_bersih.append(
            {
                "nama": str(ide.get("nama", "")).strip(),
                "kategori": str(ide.get("kategori", "")).strip(),
                "kesulitan": str(ide.get("kesulitan", "")).strip(),
                "deskripsi": str(ide.get("deskripsi", "")).strip(),
                "bahan": [
                    str(bahan).strip()
                    for bahan in (ide.get("bahan") or [])
                    if isinstance(bahan, str) and str(bahan).strip()
                ],
                "cogs": cogs,
                "harga": harga,
                "margin": margin_persen(harga, cogs),
                "alasan": str(ide.get("alasan", "")).strip(),
            }
        )

    return {
        "ringkasan_analisa": str(hasil.get("ringkasan_analisa", "")).strip(),
        "ide_menu": ide_bersih,
        "tips_eksekusi": [
            str(tips).strip()
            for tips in hasil.get("tips_eksekusi", [])
            if isinstance(tips, str) and str(tips).strip()
        ],
    }
