"""Validasi input POST /api/menu-ideas."""

from rest_framework import serializers


class MenuExistingSerializer(serializers.Serializer):
    name = serializers.CharField(
        max_length=200,
        error_messages={
            "required": "Ada menu yang belum diberi nama.",
            "blank": "Ada menu yang belum diberi nama.",
        },
    )
    price = serializers.FloatField(
        min_value=0,
        error_messages={
            "required": "Ada menu yang belum diisi harganya.",
            "invalid": "Harga harus berupa angka.",
            "min_value": "Harga tidak boleh minus.",
        },
    )
    margin = serializers.FloatField(
        required=False,
        default=0,
        error_messages={"invalid": "Margin harus berupa angka."},
    )


class MenuIdeasSerializer(serializers.Serializer):
    existingMenu = serializers.ListField(  # noqa: N815 — nama dikunci kontrak API
        child=MenuExistingSerializer(),
        min_length=1,
        max_length=100,
        error_messages={
            "required": "Daftar menu yang sudah ada belum diisi.",
            "min_length": "Isi minimal satu menu yang sudah ada dulu.",
            "max_length": "Terlalu banyak menu sekaligus, maksimal 100.",
        },
    )
    kondisi = serializers.CharField(required=False, allow_blank=True, default="", max_length=1000)
    targetPelanggan = serializers.CharField(  # noqa: N815
        required=False, allow_blank=True, default="", max_length=300
    )
    maxCogs = serializers.FloatField(  # noqa: N815
        min_value=0,
        error_messages={
            "required": "Batas biaya bahan belum diisi.",
            "invalid": "Batas biaya bahan harus berupa angka.",
            "min_value": "Batas biaya bahan tidak boleh minus.",
        },
    )
    jumlahIde = serializers.IntegerField(  # noqa: N815
        required=False,
        default=3,
        min_value=1,
        max_value=10,
        error_messages={
            "invalid": "Jumlah ide harus berupa angka.",
            "min_value": "Minimal minta 1 ide.",
            "max_value": "Maksimal 10 ide sekaligus.",
        },
    )
