"""Fitur Tab 3 · Ranking Profitabilitas."""

from __future__ import annotations

from typing import Any

from apps.ai.gemini import call_gemini
from apps.ai.schemas.ranking import SCHEMA_RANKING
from apps.optimizer.features.hitungan import margin_persen, profit_mingguan
from apps.optimizer.prompts.ranking import SYSTEM_RANKING, prompt_ranking

STATUS_SAH = {"GREEN", "YELLOW", "RED"}

# Dipakai hanya kalau model tidak mengembalikan aksi untuk sebuah menu.
AKSI_CADANGAN = {
    "GREEN": "Pertahankan menu ini dan tawarkan lebih sering ke pembeli.",
    "YELLOW": "Coba naikkan harga sedikit atau rapikan porsinya, lalu pantau seminggu.",
    "RED": "Menu ini menggerus profit. Rombak resep dan harganya, atau hentikan dulu.",
}


def _urutkan(menu_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Hitung profit & margin tiap menu, lalu urutkan dari yang paling
    menyumbang profit mingguan. Ini inti Tab 3, jadi tidak diserahkan ke AI."""
    dihitung = [
        {
            "item": item["name"],
            "weekly_profit": profit_mingguan(item["price"], item["cogs"], item["weeklySales"]),
            "margin_percentage": margin_persen(item["price"], item["cogs"]),
        }
        for item in menu_items
    ]
    dihitung.sort(key=lambda baris: baris["weekly_profit"], reverse=True)
    for nomor, baris in enumerate(dihitung, start=1):
        baris["rank"] = nomor
    return dihitung


def _baris_untuk_prompt(dihitung: list[dict[str, Any]]) -> str:
    return "\n".join(
        f"{baris['rank']}. {baris['item']} — profit seminggu Rp {baris['weekly_profit']:,.0f}, "
        f"margin {baris['margin_percentage']}%"
        for baris in dihitung
    )


def ranking_profitabilitas(data: dict[str, Any]) -> dict[str, Any]:
    dihitung = _urutkan(data["menuItems"])

    hasil = call_gemini(
        system_instruction=SYSTEM_RANKING,
        user_prompt=prompt_ranking(_baris_untuk_prompt(dihitung), len(dihitung)),
        schema=SCHEMA_RANKING,
        endpoint="ranking",
    )

    # Model mengisi status & aksi; angka dan urutan tetap versi Python supaya
    # ranking tidak pernah bertentangan dengan aritmetikanya sendiri.
    status_per_menu = {
        str(baris.get("item", "")): (baris.get("status"), baris.get("action", ""))
        for baris in hasil.get("rankings", [])
        if isinstance(baris, dict)
    }

    rankings: list[dict[str, Any]] = []
    for baris in dihitung:
        status, aksi = status_per_menu.get(baris["item"], (None, ""))
        if status not in STATUS_SAH:
            # Jaring pengaman kalau model menulis nama menu berbeda: jangan
            # sampai kartu menu tampil tanpa pita status sama sekali.
            status = "GREEN" if baris["weekly_profit"] > 0 else "RED"
        if not aksi:
            # Kartu tanpa aksi melanggar prinsip "output berupa keputusan,
            # bukan angka mentah" (PRD §3.2).
            aksi = AKSI_CADANGAN[status]
        rankings.append(
            {
                "rank": baris["rank"],
                "item": baris["item"],
                "weekly_profit": baris["weekly_profit"],
                "margin_percentage": baris["margin_percentage"],
                "status": status,
                "action": aksi,
            }
        )

    return {
        "rankings": rankings,
        "total_weekly_profit": sum(baris["weekly_profit"] for baris in rankings),
        "items_to_promote": sum(1 for baris in rankings if baris["status"] == "GREEN"),
        "items_to_reprice": sum(1 for baris in rankings if baris["status"] == "YELLOW"),
        "items_to_remove": sum(1 for baris in rankings if baris["status"] == "RED"),
    }
