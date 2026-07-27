"""Schema respons POST /api/menu-ideas (Tab 7 · AI Menu Ideas)."""

from typing import Any

from apps.ai.schemas.bentuk import angka, daftar, daftar_teks, objek, pilihan, teks

KESULITAN = ["Mudah", "Sedang", "Sulit"]

SCHEMA_MENU_IDEAS: dict[str, Any] = objek(
    {
        "ringkasan_analisa": teks(
            "Satu-dua kalimat: celah apa yang ada di menu sekarang dan kenapa ide ini menutupnya."
        ),
        "ide_menu": daftar(
            objek(
                {
                    "nama": teks("Nama menu yang enak diucapkan dan mudah diingat pembeli."),
                    "kategori": teks("Kategori, mis. 'Makanan Berat', 'Minuman', 'Camilan'."),
                    "kesulitan": pilihan(
                        "Tingkat kesulitan memasak untuk dapur warung kecil.", KESULITAN
                    ),
                    "deskripsi": teks("Gambaran singkat menunya, satu-dua kalimat."),
                    "bahan": daftar_teks("Bahan utama yang dibutuhkan."),
                    "cogs": angka("Perkiraan biaya bahan per porsi, rupiah."),
                    "harga": angka("Harga jual yang disarankan, rupiah."),
                    "margin": angka("Margin di harga jual tersebut, persen."),
                    "alasan": teks("Kenapa menu ini cocok untuk warung dan pelanggannya."),
                }
            ),
            "Ide menu baru.",
        ),
        "tips_eksekusi": daftar_teks(
            "Langkah praktis saat mulai menjual menu-menu ini, satu kalimat per tips."
        ),
    }
)
