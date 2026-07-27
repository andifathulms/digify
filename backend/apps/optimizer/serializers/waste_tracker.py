"""Validasi input POST /api/waste-tracker.

Endpoint ini memakai nama field Bahasa Indonesia — juga dikunci kontrak API.
"""

from rest_framework import serializers


class BahanWasteSerializer(serializers.Serializer):
    nama = serializers.CharField(
        max_length=200,
        error_messages={
            "required": "Ada bahan yang belum diberi nama.",
            "blank": "Ada bahan yang belum diberi nama.",
        },
    )
    jumlahBeli = serializers.FloatField(  # noqa: N815 — nama dikunci kontrak API
        min_value=0,
        error_messages={
            "required": "Ada bahan yang belum diisi jumlah belinya.",
            "invalid": "Jumlah beli harus berupa angka.",
            "min_value": "Jumlah beli tidak boleh minus.",
        },
    )
    satuan = serializers.CharField(
        max_length=30,
        error_messages={
            "required": "Ada bahan yang belum diisi satuannya.",
            "blank": "Ada bahan yang belum diisi satuannya.",
        },
    )
    hargaSatuan = serializers.FloatField(  # noqa: N815
        min_value=0,
        error_messages={
            "required": "Ada bahan yang belum diisi harga per satuannya.",
            "invalid": "Harga per satuan harus berupa angka.",
            "min_value": "Harga per satuan tidak boleh minus.",
        },
    )
    jumlahTerbuang = serializers.FloatField(  # noqa: N815
        min_value=0,
        error_messages={
            "required": "Ada bahan yang belum diisi jumlah terbuangnya.",
            "invalid": "Jumlah terbuang harus berupa angka.",
            "min_value": "Jumlah terbuang tidak boleh minus.",
        },
    )
    penyebab = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=300,
    )

    def validate(self, attrs: dict) -> dict:
        if attrs["jumlahTerbuang"] > attrs["jumlahBeli"]:
            raise serializers.ValidationError(
                f"Jumlah terbuang «{attrs['nama']}» lebih banyak daripada jumlah belinya. "
                "Coba periksa lagi angkanya."
            )
        return attrs


class WasteTrackerSerializer(serializers.Serializer):
    periode = serializers.CharField(
        max_length=100,
        error_messages={
            "required": "Periode belum diisi.",
            "blank": "Periode belum diisi.",
        },
    )
    bahanList = serializers.ListField(  # noqa: N815
        child=BahanWasteSerializer(),
        min_length=1,
        max_length=100,
        error_messages={
            "required": "Daftar bahan belum diisi.",
            "min_length": "Isi minimal satu bahan dulu.",
            "max_length": "Terlalu banyak bahan sekaligus, maksimal 100.",
        },
    )
