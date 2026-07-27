"""Schema respons POST /api/marketing-content (Tab 8 · Konten Promosi)."""

from typing import Any

from apps.ai.schemas.bentuk import daftar_teks, objek, teks

SCHEMA_MARKETING_CONTENT: dict[str, Any] = objek(
    {
        "caption_utama": teks(
            "Caption siap posting, sudah termasuk emoji seperlunya dan jeda baris."
        ),
        "caption_alternatif": daftar_teks(
            "Dua sampai tiga caption alternatif dengan sudut pandang berbeda."
        ),
        "hashtag_rekomendasi": daftar_teks(
            "Hashtag relevan, campuran hashtag umum dan hashtag lokal. Sertakan tanda pagar."
        ),
        "ide_visual": teks("Gambaran foto atau video yang cocok menemani caption ini."),
        "call_to_action": teks("Ajakan penutup yang jelas, mis. cara memesan."),
        "waktu_posting_ideal": teks(
            "Kapan sebaiknya diposting dan kenapa, disesuaikan kebiasaan pembeli Indonesia."
        ),
    }
)
