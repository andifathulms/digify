"""Validasi input POST /api/ranking."""

from rest_framework import serializers


class MenuItemRankingSerializer(serializers.Serializer):
    name = serializers.CharField(
        max_length=200,
        error_messages={
            "required": "Ada menu yang belum diberi nama.",
            "blank": "Ada menu yang belum diberi nama.",
        },
    )
    cogs = serializers.FloatField(
        min_value=0,
        error_messages={
            "required": "Ada menu yang belum diisi biaya bahannya.",
            "invalid": "Biaya bahan harus berupa angka.",
            "min_value": "Biaya bahan tidak boleh minus.",
        },
    )
    price = serializers.FloatField(
        min_value=0,
        error_messages={
            "required": "Ada menu yang belum diisi harga jualnya.",
            "invalid": "Harga jual harus berupa angka.",
            "min_value": "Harga jual tidak boleh minus.",
        },
    )
    weeklySales = serializers.FloatField(  # noqa: N815 — nama dikunci kontrak API
        min_value=0,
        error_messages={
            "required": "Ada menu yang belum diisi jumlah terjual per minggu.",
            "invalid": "Jumlah terjual per minggu harus berupa angka.",
            "min_value": "Jumlah terjual tidak boleh minus.",
        },
    )


class RankingSerializer(serializers.Serializer):
    menuItems = serializers.ListField(  # noqa: N815
        child=MenuItemRankingSerializer(),
        min_length=1,
        max_length=100,
        error_messages={
            "required": "Daftar menu belum diisi.",
            "min_length": "Isi minimal satu menu dulu.",
            "max_length": "Terlalu banyak menu sekaligus, maksimal 100.",
        },
    )
