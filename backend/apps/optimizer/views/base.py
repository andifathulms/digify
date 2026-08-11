"""Kerangka bersama untuk 9 endpoint optimizer.

View tetap tipis (CLAUDE.md §6): validasi lewat serializer, panggil fungsi
fitur, kembalikan Response. Tidak ada logika bisnis di sini.

Ada dua macam endpoint:

- `pakai_ai = True`  → Growth Engine (Tab 7, 8, 9/10). Memanggil Gemini, jadi
  memotong kuota harian dan dicatat di UsageLog.
- `pakai_ai = False` → Profit Engine (Tab 1–6). Seluruhnya hitungan dan aturan
  di dalam kode kita sendiri. Tidak menyentuh API mana pun, tidak berbiaya,
  jadi tidak memotong kuota siapa pun.

Pembedaan itu bukan detail teknis: kuota harian ada untuk menahan biaya AI.
Memotongnya untuk endpoint yang tidak berbiaya sama saja menghukum user tanpa
alasan, dan membuat jatah AI-nya habis oleh hitungan yang gratis.
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


class EndpointOptimizer(APIView):
    """Base view: satu serializer masuk, satu fungsi fitur, satu Response keluar."""

    # Semua endpoint wajib login, termasuk yang tidak memakai AI: isinya data
    # usaha milik pembeli, bukan alat publik.
    permission_classes = [IsAuthenticated]

    # Throttle burst dari REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"].
    throttle_scope = "ai"

    serializer_class: type[serializers.Serializer]
    # Wajib dibungkus staticmethod di subclass, supaya tidak ikut ter-bind ke self.
    feature: Callable[[dict[str, Any]], dict[str, Any]]

    # Diubah jadi False oleh endpoint yang murni aturan (Tab 1–6).
    pakai_ai: bool = True

    # Nama endpoint untuk pencatatan pemakaian; diambil dari path kalau kosong.
    nama_endpoint: str = ""

    def _nama(self, request: Request) -> str:
        return self.nama_endpoint or request.path.rsplit("/", 1)[-1]

    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not self.pakai_ai:
            # Tidak ada panggilan berbayar di jalur ini: langsung hitung.
            return Response(self.feature(serializer.validated_data))

        nama = self._nama(request)

        # Diperiksa SEBELUM Gemini dihubungi. Kalau setelahnya, biayanya sudah
        # terlanjur keluar dan penolakannya jadi tidak ada gunanya.
        #
        # Nama endpoint ikut dikirim karena sebagian alat punya jatah sendiri
        # di atas jatah harian umum (settings.KUOTA_HARIAN_ENDPOINT).
        pastikan_kuota_cukup(request.user, nama)
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
        respons["X-Sisa-Kuota"] = str(sisa_kuota(request.user, nama))
        return respons


class EndpointAI(EndpointOptimizer):
    """Endpoint yang memanggil Gemini. Memotong kuota harian."""

    pakai_ai = True


class EndpointAturan(EndpointOptimizer):
    """Endpoint yang seluruhnya hitungan dan aturan sendiri.

    Tidak memanggil API mana pun, jadi tetap jalan walau GEMINI_API_KEY kosong
    dan tidak pernah memotong kuota harian.
    """

    pakai_ai = False
