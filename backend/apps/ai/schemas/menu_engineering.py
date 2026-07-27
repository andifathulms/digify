"""Schema respons POST /api/menu-engineering (Tab 4 · Optimasi Menu)."""

from typing import Any

from apps.ai.schemas.bentuk import angka, daftar, objek, teks


def _rekomendasi(deskripsi: str) -> dict[str, Any]:
    """Bentuk rekomendasi yang sama untuk keempat kelompok: menu, alasan,
    aksi, dan perkiraan dampaknya ke profit bulanan."""
    return daftar(
        objek(
            {
                "item": teks(
                    "Nama menu. Untuk bundling, tulis gabungannya, "
                    "mis. 'Nasi Goreng Spesial + Es Teh Manis'."
                ),
                "alasan": teks("Kenapa menu ini masuk kelompok tersebut, satu-dua kalimat."),
                "aksi": teks("Langkah konkret yang bisa dikerjakan pemilik warung."),
                "estimasi_dampak": angka(
                    "Perkiraan perubahan profit sebulan dalam rupiah. "
                    "Boleh minus kalau langkahnya mengurangi omzet."
                ),
            }
        ),
        deskripsi,
    )


SCHEMA_MENU_ENGINEERING: dict[str, Any] = objek(
    {
        "remove": _rekomendasi("Menu yang sebaiknya dihentikan."),
        "promote": _rekomendasi("Menu yang layak didorong lebih keras."),
        "reprice": _rekomendasi("Menu yang harganya perlu diperbaiki."),
        "bundle": _rekomendasi("Gabungan menu yang layak dijual sepaket."),
        "total_estimated_impact": angka(
            "Perkiraan total perubahan profit sebulan kalau semua langkah dijalankan, rupiah."
        ),
    }
)
