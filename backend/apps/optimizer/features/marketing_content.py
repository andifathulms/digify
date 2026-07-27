"""Fitur Tab 8 · Konten Promosi."""

from __future__ import annotations

from typing import Any

from apps.ai.gemini import call_gemini
from apps.ai.schemas.marketing_content import SCHEMA_MARKETING_CONTENT
from apps.optimizer.features.bersihkan import daftar_teks, teks
from apps.optimizer.prompts.marketing_content import (
    SYSTEM_MARKETING_CONTENT,
    prompt_marketing_content,
)


def konten_promosi(data: dict[str, Any]) -> dict[str, Any]:
    hasil = call_gemini(
        system_instruction=SYSTEM_MARKETING_CONTENT,
        user_prompt=prompt_marketing_content(
            nama_menu=data["namaMenu"],
            keunggulan=data["keunggulan"],
            platform=data["platform"],
            gaya=data["gaya"],
            info_promo=data["infoPromo"],
        ),
        schema=SCHEMA_MARKETING_CONTENT,
        endpoint="marketing-content",
    )

    return {
        "caption_utama": teks(hasil.get("caption_utama")),
        "caption_alternatif": daftar_teks(hasil.get("caption_alternatif")),
        "hashtag_rekomendasi": daftar_teks(hasil.get("hashtag_rekomendasi")),
        "ide_visual": teks(hasil.get("ide_visual")),
        "call_to_action": teks(hasil.get("call_to_action")),
        "waktu_posting_ideal": teks(hasil.get("waktu_posting_ideal")),
    }
