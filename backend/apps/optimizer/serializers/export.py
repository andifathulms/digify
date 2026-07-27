"""Validasi input POST /api/export."""

from rest_framework import serializers


class MenuItemExportSerializer(serializers.Serializer):
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
    oldPrice = serializers.FloatField(  # noqa: N815 — nama dikunci kontrak API
        min_value=0,
        error_messages={
            "required": "Ada menu yang belum diisi harga lamanya.",
            "invalid": "Harga lama harus berupa angka.",
            "min_value": "Harga lama tidak boleh minus.",
        },
    )
    newPrice = serializers.FloatField(  # noqa: N815
        min_value=0,
        error_messages={
            "required": "Ada menu yang belum diisi harga barunya.",
            "invalid": "Harga baru harus berupa angka.",
            "min_value": "Harga baru tidak boleh minus.",
        },
    )
    margin = serializers.FloatField(
        required=False,
        default=0,
        error_messages={"invalid": "Margin harus berupa angka."},
    )
    weeklySales = serializers.FloatField(  # noqa: N815
        min_value=0,
        error_messages={
            "required": "Ada menu yang belum diisi jumlah terjual per minggu.",
            "invalid": "Jumlah terjual per minggu harus berupa angka.",
            "min_value": "Jumlah terjual tidak boleh minus.",
        },
    )


class ExportSerializer(serializers.Serializer):
    restaurantName = serializers.CharField(  # noqa: N815
        max_length=200,
        error_messages={
            "required": "Nama restoran belum diisi.",
            "blank": "Nama restoran belum diisi.",
        },
    )
    date = serializers.CharField(
        max_length=60,
        error_messages={
            "required": "Tanggal laporan belum diisi.",
            "blank": "Tanggal laporan belum diisi.",
        },
    )
    menuItems = serializers.ListField(  # noqa: N815
        child=MenuItemExportSerializer(),
        min_length=1,
        max_length=100,
        error_messages={
            "required": "Daftar menu belum diisi.",
            "min_length": "Isi minimal satu menu dulu.",
            "max_length": "Terlalu banyak menu sekaligus, maksimal 100.",
        },
    )
