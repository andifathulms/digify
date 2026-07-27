"""Validasi input POST /api/menu-engineering."""

from rest_framework import serializers

STATUS_PILIHAN = ["GREEN", "YELLOW", "RED"]


class MenuItemEngineeringSerializer(serializers.Serializer):
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
    margin = serializers.FloatField(
        required=False,
        default=0,
        error_messages={"invalid": "Margin harus berupa angka."},
    )
    weeklySales = serializers.FloatField(  # noqa: N815 — nama dikunci kontrak API
        min_value=0,
        error_messages={
            "required": "Ada menu yang belum diisi jumlah terjual per minggu.",
            "invalid": "Jumlah terjual per minggu harus berupa angka.",
            "min_value": "Jumlah terjual tidak boleh minus.",
        },
    )
    status = serializers.ChoiceField(
        choices=STATUS_PILIHAN,
        required=False,
        allow_blank=True,
        default="",
        error_messages={"invalid_choice": "Status menu hanya boleh GREEN, YELLOW, atau RED."},
    )


class MenuEngineeringSerializer(serializers.Serializer):
    menuItems = serializers.ListField(  # noqa: N815
        child=MenuItemEngineeringSerializer(),
        min_length=1,
        max_length=100,
        error_messages={
            "required": "Daftar menu belum diisi.",
            "min_length": "Isi minimal satu menu dulu.",
            "max_length": "Terlalu banyak menu sekaligus, maksimal 100.",
        },
    )
    minItems = serializers.IntegerField(  # noqa: N815
        required=False,
        default=4,
        min_value=1,
        error_messages={
            "invalid": "Jumlah menu minimum harus berupa angka.",
            "min_value": "Jumlah menu minimum paling sedikit 1.",
        },
    )
    peakHours = serializers.CharField(  # noqa: N815
        required=False,
        allow_blank=True,
        default="",
        max_length=120,
    )
