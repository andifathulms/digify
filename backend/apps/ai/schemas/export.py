"""Schema respons POST /api/export (Tab 5 · Laporan Final).

Perhatikan pembalikan bahasa: field request berbahasa Inggris, field respons
berbahasa Indonesia. Itu memang begitu dan tidak boleh dinormalkan
(docs/API_CONTRACT.md §5).
"""

from typing import Any

from apps.ai.schemas.bentuk import angka, bulat, daftar, objek, teks

SCHEMA_EXPORT: dict[str, Any] = objek(
    {
        "nama_restoran": teks("Nama restoran, persis seperti yang diketik pengguna."),
        "tanggal": teks("Tanggal laporan, persis seperti yang diketik pengguna."),
        "menu_items": daftar(
            objek(
                {
                    "nama_menu": teks("Nama menu."),
                    "biaya_bahan": angka("Biaya bahan per porsi, rupiah."),
                    "harga_lama": angka("Harga jual sebelum perubahan, rupiah."),
                    "harga_baru": angka("Harga jual setelah perubahan, rupiah."),
                    "margin": angka("Margin di harga baru, persen."),
                    "terjual_per_minggu": angka("Jumlah porsi terjual dalam seminggu."),
                    "catatan": teks(
                        "Satu kalimat singkat: apa yang berubah pada menu ini dan kenapa. "
                        "Kalau harganya tidak berubah, katakan begitu."
                    ),
                }
            ),
            "Baris laporan, satu per menu.",
        ),
        "ringkasan": objek(
            {
                "total_item": bulat("Banyaknya menu dalam laporan."),
                "item_direprice": bulat("Banyaknya menu yang harganya berubah."),
                "estimasi_kenaikan_profit_bulanan": angka(
                    "Perkiraan tambahan profit sebulan dari perubahan harga, rupiah."
                ),
                "catatan_penutup": teks(
                    "Satu-dua kalimat penutup untuk pemilik warung: apa langkah "
                    "berikutnya setelah membaca laporan ini."
                ),
            }
        ),
    }
)
