"""Validasi input POST /api/cost-calculator.

Nama field request DIKUNCI oleh docs/API_CONTRACT.md (camelCase, Inggris).
Pesan error ditulis Bahasa Indonesia karena user melihatnya langsung.
"""

from rest_framework import serializers


class CostCalculatorSerializer(serializers.Serializer):
    itemName = serializers.CharField(  # noqa: N815 — nama dikunci kontrak API
        max_length=200,
        error_messages={
            "required": "Nama menu belum diisi.",
            "blank": "Nama menu belum diisi.",
        },
    )
    ingredientsList = serializers.CharField(  # noqa: N815
        error_messages={
            "required": "Daftar bahan belum diisi.",
            "blank": "Daftar bahan belum diisi.",
        },
    )
    portionWeight = serializers.FloatField(  # noqa: N815
        min_value=0,
        error_messages={
            "required": "Berat per porsi belum diisi.",
            "invalid": "Berat per porsi harus berupa angka.",
            "min_value": "Berat per porsi tidak boleh minus.",
        },
    )
    currentPrice = serializers.FloatField(  # noqa: N815
        min_value=0,
        error_messages={
            "required": "Harga jual sekarang belum diisi.",
            "invalid": "Harga jual harus berupa angka.",
            "min_value": "Harga jual tidak boleh minus.",
        },
    )
