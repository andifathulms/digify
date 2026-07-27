"""Schema respons POST /api/carousel-content (Tab 9 & Tab 10).

Satu endpoint, dua tab. Tab 9 menampilkan teksnya, Tab 10 merender payload
yang sama jadi gambar slide 1080x1350. Endpoint ini TIDAK boleh diduplikasi
(docs/API_CONTRACT.md §9).
"""

from typing import Any

from apps.ai.schemas.bentuk import bulat, daftar, daftar_teks, objek, teks

SCHEMA_CAROUSEL_CONTENT: dict[str, Any] = objek(
    {
        "ringkasan_konsep": teks("Satu-dua kalimat: alur cerita carousel ini."),
        "slides": daftar(
            objek(
                {
                    "nomor_slide": bulat("Nomor urut slide, mulai dari 1."),
                    "tipe_slide": teks(
                        "Peran slide dalam alur, mis. 'Hook', 'Masalah', 'Solusi', "
                        "'Bukti', 'Penutup'."
                    ),
                    "teks_slide": teks(
                        "Teks yang tampil di slide. Pendek dan besar — ini dibaca "
                        "sambil scroll di HP, bukan dibaca seperti artikel."
                    ),
                    "petunjuk_foto": teks(
                        "Saran foto untuk slide ini, ditujukan kepada pemilik warung. "
                        "Teks ini TIDAK ditampilkan di gambar jadi."
                    ),
                }
            ),
            "Slide carousel, berurutan.",
        ),
        "caption_post": teks("Caption untuk postingan carousel-nya."),
        "hashtag_rekomendasi": daftar_teks("Hashtag relevan, sertakan tanda pagar."),
    }
)
