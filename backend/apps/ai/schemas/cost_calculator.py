"""Schema respons POST /api/cost-calculator (Tab 1 · Biaya Menu).

Nama field DIKUNCI oleh docs/API_CONTRACT.md. Campuran Inggris–Indonesia
disengaja dan tidak boleh dirapikan (keputusan Owner, PRD §0).
"""

from typing import Any

from apps.ai.schemas.bentuk import angka, daftar, objek, teks

SCHEMA_COST_CALCULATOR: dict[str, Any] = objek(
    {
        "item_name": teks("Nama menu, persis seperti yang diketik pengguna."),
        "ingredients_breakdown": daftar(
            objek(
                {
                    "nama": teks("Nama bahan, mis. 'Beras'."),
                    "jumlah": angka("Jumlah bahan yang benar-benar dipakai per porsi."),
                    "satuan": teks("Satuan pemakaian, mis. 'gram', 'ml', 'butir'."),
                    "harga_satuan": angka(
                        "Harga beli per satuan pemakaian dalam rupiah bulat."
                    ),
                    "biaya": angka(
                        "jumlah x harga_satuan, dibulatkan ke rupiah penuh."
                    ),
                }
            ),
            "Rincian biaya tiap bahan untuk SATU porsi.",
        ),
        "cogs_per_portion": angka(
            "Total biaya bahan untuk satu porsi dalam rupiah bulat."
        ),
        "current_margin_percentage": angka(
            "Margin di harga jual sekarang: (harga - cogs) / harga x 100."
        ),
        "food_waste_percentage": angka(
            "Perkiraan persentase bahan terbuang saat persiapan menu ini."
        ),
    }
)
