"""Fitur Tab 9 & Tab 10 · Carousel Konten.

Satu fitur untuk dua tab. Tab 9 menampilkan teksnya apa adanya, Tab 10
merender payload yang sama menjadi gambar 1080x1350 di sisi klien. Tidak ada
endpoint kedua (docs/API_CONTRACT.md §9).
"""

from __future__ import annotations

from typing import Any

from apps.ai.gemini import call_gemini
from apps.ai.schemas.carousel_content import SCHEMA_CAROUSEL_CONTENT
from apps.optimizer.features.bersihkan import daftar_teks, teks
from apps.optimizer.prompts.carousel_content import (
    SYSTEM_CAROUSEL_CONTENT,
    prompt_carousel_content,
)


def konten_carousel(data: dict[str, Any]) -> dict[str, Any]:
    jumlah_slide = data["jumlahSlide"]

    hasil = call_gemini(
        system_instruction=SYSTEM_CAROUSEL_CONTENT,
        user_prompt=prompt_carousel_content(
            nama_menu=data["namaMenu"],
            keunggulan=data["keunggulan"],
            platform=data["platform"],
            gaya=data["gaya"],
            info_promo=data["infoPromo"],
            jumlah_slide=jumlah_slide,
        ),
        schema=SCHEMA_CAROUSEL_CONTENT,
        endpoint="carousel-content",
    )

    slides: list[dict[str, Any]] = []
    for slide in hasil.get("slides", []):
        if not isinstance(slide, dict):
            continue
        isi_slide = teks(slide.get("teks_slide"))
        if not isi_slide:
            # Slide kosong akan dirender jadi kartu kosong di Tab 10.
            continue
        slides.append(
            {
                "nomor_slide": len(slides) + 1,  # nomor dirapikan ulang, tidak dipercaya
                "tipe_slide": teks(slide.get("tipe_slide")),
                "teks_slide": isi_slide,
                "petunjuk_foto": teks(slide.get("petunjuk_foto")),
            }
        )

    return {
        "ringkasan_konsep": teks(hasil.get("ringkasan_konsep")),
        "slides": slides[:jumlah_slide],
        "caption_post": teks(hasil.get("caption_post")),
        "hashtag_rekomendasi": daftar_teks(hasil.get("hashtag_rekomendasi")),
    }
