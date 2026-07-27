"""Validasi input akun. Semua pesan Bahasa Indonesia."""

from __future__ import annotations

from typing import Any

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.accounts.models import User


class ProfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "full_name", "whatsapp", "must_change_password"]
        read_only_fields = fields


class MasukSerializer(serializers.Serializer):
    email = serializers.EmailField(
        error_messages={
            "required": "Email belum diisi.",
            "blank": "Email belum diisi.",
            "invalid": "Format email belum benar.",
        }
    )
    kata_sandi = serializers.CharField(
        write_only=True,
        error_messages={
            "required": "Kata sandi belum diisi.",
            "blank": "Kata sandi belum diisi.",
        },
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        user = authenticate(username=attrs["email"].strip().lower(), password=attrs["kata_sandi"])
        # Satu pesan untuk email salah maupun kata sandi salah. Membedakannya
        # memberi tahu orang asing bahwa sebuah email terdaftar di sini.
        # Akun yang dinonaktifkan juga jatuh ke sini: `authenticate` menolaknya
        # lebih dulu. Itu memang yang kita mau — pesan khusus "akun nonaktif"
        # sama saja memberitahu bahwa email itu terdaftar. Owner bisa melihat
        # status akun di admin kalau ada pembeli yang mengeluh.
        if user is None:
            raise serializers.ValidationError("Email atau kata sandi belum cocok.")
        attrs["user"] = user
        return attrs


class GantiKataSandiSerializer(serializers.Serializer):
    kata_sandi_lama = serializers.CharField(
        write_only=True,
        error_messages={
            "required": "Kata sandi lama belum diisi.",
            "blank": "Kata sandi lama belum diisi.",
        },
    )
    kata_sandi_baru = serializers.CharField(
        write_only=True,
        error_messages={
            "required": "Kata sandi baru belum diisi.",
            "blank": "Kata sandi baru belum diisi.",
        },
    )

    def validate_kata_sandi_lama(self, nilai: str) -> str:
        user = self.context["request"].user
        if not user.check_password(nilai):
            raise serializers.ValidationError("Kata sandi lama belum cocok.")
        return nilai

    def validate_kata_sandi_baru(self, nilai: str) -> str:
        try:
            validate_password(nilai, self.context["request"].user)
        except DjangoValidationError as galat:
            # Pesan bawaan Django berbahasa Inggris di sebagian kasus; ganti
            # dengan satu kalimat yang pasti dimengerti.
            raise serializers.ValidationError(
                "Kata sandi baru terlalu mudah ditebak. "
                "Pakai minimal 8 karakter, campur huruf dan angka."
            ) from galat
        return nilai

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if attrs["kata_sandi_lama"] == attrs["kata_sandi_baru"]:
            raise serializers.ValidationError("Kata sandi baru masih sama dengan yang lama.")
        return attrs
