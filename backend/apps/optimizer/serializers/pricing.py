"""Validasi input POST /api/pricing."""

from rest_framework import serializers


class PricingSerializer(serializers.Serializer):
    itemName = serializers.CharField(  # noqa: N815 — nama dikunci kontrak API
        max_length=200,
        error_messages={
            "required": "Nama menu belum diisi.",
            "blank": "Nama menu belum diisi.",
        },
    )
    cogs = serializers.FloatField(
        min_value=0,
        error_messages={
            "required": "Biaya bahan per porsi belum diisi.",
            "invalid": "Biaya bahan harus berupa angka.",
            "min_value": "Biaya bahan tidak boleh minus.",
        },
    )
    targetMargin = serializers.FloatField(  # noqa: N815
        required=False,
        default=65,
        min_value=0,
        max_value=99,
        error_messages={
            "invalid": "Target margin harus berupa angka.",
            "min_value": "Target margin tidak boleh minus.",
            "max_value": "Target margin tidak mungkin 100% atau lebih.",
        },
    )
    competitorPrice = serializers.FloatField(  # noqa: N815
        required=False,
        allow_null=True,
        default=None,
        min_value=0,
        error_messages={
            "invalid": "Harga kompetitor harus berupa angka.",
            "min_value": "Harga kompetitor tidak boleh minus.",
        },
    )
    platformFeePercent = serializers.FloatField(  # noqa: N815
        required=False,
        default=27,
        min_value=0,
        max_value=99,
        error_messages={
            "invalid": "Komisi aplikasi harus berupa angka.",
            "min_value": "Komisi aplikasi tidak boleh minus.",
            "max_value": "Komisi aplikasi tidak mungkin 100% atau lebih.",
        },
    )
    location = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=120,
    )
