"""Validasi daftar menu tersimpan."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from rest_framework import serializers

from apps.catalog.models import MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    """Bentuk yang dikirim ke frontend.

    Nama field mengikuti kolom model (snake_case). Ini BUKAN salah satu dari 9
    endpoint AI, jadi tidak terikat campuran nama di docs/API_CONTRACT.md.
    """

    class Meta:
        model = MenuItem
        fields = ["name", "cogs", "price", "weekly_sales", "status"]


class BarisMenuSerializer(serializers.Serializer):
    name = serializers.CharField(
        max_length=200,
        error_messages={
            "required": "Ada menu yang belum diberi nama.",
            "blank": "Ada menu yang belum diberi nama.",
        },
    )
    cogs = serializers.DecimalField(
        max_digits=12,
        decimal_places=0,
        min_value=Decimal(0),
        default=Decimal(0),
        error_messages={"invalid": "Biaya bahan harus berupa angka."},
    )
    price = serializers.DecimalField(
        max_digits=12,
        decimal_places=0,
        min_value=Decimal(0),
        default=Decimal(0),
        error_messages={"invalid": "Harga jual harus berupa angka."},
    )
    weekly_sales = serializers.DecimalField(
        max_digits=10,
        decimal_places=0,
        min_value=Decimal(0),
        default=Decimal(0),
        error_messages={"invalid": "Jumlah terjual harus berupa angka."},
    )
    status = serializers.ChoiceField(
        choices=MenuItem.Status.choices,
        required=False,
        allow_blank=True,
        default="",
        error_messages={"invalid_choice": "Status menu hanya boleh GREEN, YELLOW, atau RED."},
    )


class SimpanMenuSerializer(serializers.Serializer):
    menu = serializers.ListField(
        child=BarisMenuSerializer(),
        max_length=100,
        error_messages={
            "required": "Daftar menu belum dikirim.",
            "max_length": "Terlalu banyak menu sekaligus, maksimal 100.",
        },
    )

    def validate_menu(self, nilai: list[dict[str, Any]]) -> list[dict[str, Any]]:
        nama = [baris["name"].strip() for baris in nilai]
        ganda = {n for n in nama if nama.count(n) > 1}
        if ganda:
            # Ditolak di sini supaya pesannya menyebut menu mana yang kembar,
            # bukan sekadar melanggar constraint unik di database.
            raise serializers.ValidationError(
                f"Menu «{sorted(ganda)[0]}» ditulis dua kali. Gabungkan dulu jadi satu."
            )
        return nilai
