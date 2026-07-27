"""Kerangka bersama untuk 9 endpoint AI.

View tetap tipis (CLAUDE.md §6): validasi lewat serializer, panggil fungsi
fitur, kembalikan Response. Tidak ada logika bisnis di sini.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.usage.kuota import catat_pemakaian, pastikan_kuota_cukup, sisa_kuota


class EndpointAI(APIView):
    """Base view: satu serializer masuk, satu fungsi fitur, satu Response keluar."""

    # Seluruh endpoint AI wajib login. Tiap panggilan memakai kuota Gemini
    # berbayar; membiarkannya terbuka berarti siapa pun bisa menghabiskan
    # tagihan Owner (PRD §8.3).
    permission_classes = [IsAuthenticated]

    # Throttle burst dari REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["ai"].
    # Ini menahan klik ganda; batas harian yang sesungguhnya ada di apps/usage.
    throttle_scope = "ai"

    serializer_class: type[serializers.Serializer]
    # Wajib dibungkus staticmethod di subclass, supaya tidak ikut ter-bind ke self.
    feature: Callable[[dict[str, Any]], dict[str, Any]]

    # Nama endpoint untuk pencatatan pemakaian; diambil dari path kalau kosong.
    nama_endpoint: str = ""

    def _nama(self, request: Request) -> str:
        return self.nama_endpoint or request.path.rsplit("/", 1)[-1]

    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Diperiksa SEBELUM Gemini dihubungi. Kalau setelahnya, biayanya sudah
        # terlanjur keluar dan penolakannya jadi tidak ada gunanya.
        pastikan_kuota_cukup(request.user)

        nama = self._nama(request)
        try:
            hasil = self.feature(serializer.validated_data)
        except Exception:
            # Panggilan gagal tetap dicatat dan tetap memotong kuota: gagal pun
            # tetap membebani kuota Gemini.
            catat_pemakaian(request.user, nama, berhasil=False)
            raise

        catat_pemakaian(request.user, nama, berhasil=True)

        respons = Response(hasil)
        # Header ini yang dibaca frontend untuk menampilkan sisa jatah hari ini.
        respons["X-Sisa-Kuota"] = str(sisa_kuota(request.user))
        return respons
