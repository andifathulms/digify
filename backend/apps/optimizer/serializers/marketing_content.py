"""Validasi input POST /api/marketing-content dan POST /api/carousel-content.

Kedua endpoint memakai input yang hampir sama; carousel hanya menambah
jumlahSlide. Serializer carousel mewarisi yang promosi supaya kalau kontrak
input berubah, keduanya ikut berubah bersamaan.
"""

from rest_framework import serializers


class MarketingContentSerializer(serializers.Serializer):
    namaMenu = serializers.CharField(  # noqa: N815 — nama dikunci kontrak API
        max_length=200,
        error_messages={
            "required": "Nama menu belum diisi.",
            "blank": "Nama menu belum diisi.",
        },
    )
    keunggulan = serializers.CharField(
        max_length=1000,
        error_messages={
            "required": "Keunggulan menu belum diisi.",
            "blank": "Keunggulan menu belum diisi.",
        },
    )
    platform = serializers.CharField(
        required=False, allow_blank=True, default="Instagram", max_length=60
    )
    gaya = serializers.CharField(required=False, allow_blank=True, default="", max_length=120)
    infoPromo = serializers.CharField(  # noqa: N815
        required=False, allow_blank=True, default="", max_length=500
    )


class CarouselContentSerializer(MarketingContentSerializer):
    jumlahSlide = serializers.IntegerField(  # noqa: N815
        required=False,
        default=4,
        min_value=3,
        max_value=10,
        error_messages={
            "invalid": "Jumlah slide harus berupa angka.",
            "min_value": "Carousel paling sedikit 3 slide.",
            "max_value": "Carousel paling banyak 10 slide.",
        },
    )
