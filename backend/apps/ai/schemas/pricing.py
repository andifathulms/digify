"""Schema respons POST /api/pricing (Tab 2 · Harga Jual)."""

from typing import Any

from apps.ai.schemas.bentuk import angka, objek, teks

SCHEMA_PRICING: dict[str, Any] = objek(
    {
        "item_name": teks("Nama menu, persis seperti yang diketik pengguna."),
        "dine_in_recommended": angka("Harga dine-in yang disarankan, rupiah bulat."),
        "delivery_recommended": angka(
            "Harga untuk aplikasi delivery, sudah memperhitungkan komisi platform."
        ),
        "psychological_price": angka(
            "Harga dine-in yang dibulatkan agar terasa lebih murah, mis. 24000 jadi 23500."
        ),
        "margin_at_recommended": angka("Margin di harga dine-in yang disarankan, persen."),
        "break_even_dine_in": angka("Harga impas dine-in, rupiah bulat."),
        "break_even_delivery": angka("Harga impas di aplikasi delivery, rupiah bulat."),
    }
)
