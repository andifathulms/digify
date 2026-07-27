"""Schema respons POST /api/ranking (Tab 3 · Ranking Profitabilitas)."""

from typing import Any

from apps.ai.schemas.bentuk import angka, bulat, daftar, objek, pilihan, teks

STATUS_MENU = ["GREEN", "YELLOW", "RED"]

SCHEMA_RANKING: dict[str, Any] = objek(
    {
        "rankings": daftar(
            objek(
                {
                    "rank": bulat("Peringkat, 1 = penyumbang profit terbesar."),
                    "item": teks("Nama menu."),
                    "weekly_profit": angka("Profit menu ini dalam seminggu, rupiah."),
                    "margin_percentage": angka("Margin menu ini, persen."),
                    "status": pilihan(
                        "GREEN = pertahankan dan promosikan. "
                        "YELLOW = masih bisa diselamatkan, biasanya lewat harga. "
                        "RED = merugikan, pertimbangkan dihapus.",
                        STATUS_MENU,
                    ),
                    "action": teks(
                        "Satu kalimat aksi konkret dalam Bahasa Indonesia sehari-hari, "
                        "langsung bisa dikerjakan pemilik warung besok pagi."
                    ),
                }
            ),
            "Menu diurutkan dari penyumbang profit mingguan terbesar.",
        ),
        "total_weekly_profit": angka("Jumlah profit seluruh menu dalam seminggu, rupiah."),
        "items_to_promote": bulat("Banyaknya menu berstatus GREEN."),
        "items_to_reprice": bulat("Banyaknya menu berstatus YELLOW."),
        "items_to_remove": bulat("Banyaknya menu berstatus RED."),
    }
)
