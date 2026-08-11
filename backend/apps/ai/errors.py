"""Terjemahan kegagalan teknis menjadi satu pesan Bahasa Indonesia.

Aturan dari CLAUDE.md §6 dan docs/API_CONTRACT.md:
- Bentuk respons gagal selalu {"error": "<pesan Bahasa Indonesia>"} dan tidak ada
  field lain.
- User tidak pernah melihat kode HTTP mentah, nama exception, atau teks Inggris.
- Exception aslinya tetap dicatat ke log supaya bisa didebug.
"""

from __future__ import annotations

import logging
from typing import Any

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)

PESAN_SIBUK = "Server AI sedang sibuk. Coba lagi 1–2 menit lagi, ini bukan salah Anda."
PESAN_KUOTA_AI = (
    "Kuota harian layanan AI sudah terpakai habis. Biasanya pulih sekitar jam 14.00 WIB."
)
PESAN_KUOTA_USER = "Kuota harian Anda sudah habis. Reset otomatis besok pagi."
PESAN_KUOTA_BULANAN = "Kuota bulan ini sudah habis. Jatahnya terisi lagi otomatis awal bulan depan."
# Per endpoint: sengaja menyebut alat lain masih bisa dipakai. Tanpa kalimat
# itu, mentok di satu alat terbaca sebagai seluruh produk berhenti bekerja.
PESAN_KUOTA_CAROUSEL = (
    "Jatah membuat carousel hari ini sudah habis. Coba lagi besok — "
    "alat lain masih bisa dipakai seperti biasa."
)
PESAN_KUOTA_ENDPOINT = "Jatah alat ini hari ini sudah habis. Alat lain masih bisa dipakai."
PESAN_TERLALU_LAMA = "Prosesnya terlalu lama, coba lagi sebentar lagi."
PESAN_UMUM = "Belum berhasil. Coba ulangi sebentar lagi ya."
PESAN_TERLALU_CEPAT = "Terlalu cepat menekan tombol. Tunggu sebentar, lalu coba lagi."
PESAN_BELUM_MASUK = "Sesi Anda sudah berakhir. Silakan masuk lagi."
PESAN_TIDAK_BOLEH = "Anda belum punya akses ke bagian ini."
PESAN_TIDAK_ADA = "Data yang Anda cari tidak ditemukan."


class AIServiceError(Exception):
    """Kegagalan dari layanan AI yang sudah punya pesan ramah + status HTTP."""

    def __init__(self, pesan: str, status_code: int) -> None:
        super().__init__(pesan)
        self.pesan = pesan
        self.status_code = status_code


class AIBusyError(AIServiceError):
    def __init__(self) -> None:
        super().__init__(PESAN_SIBUK, status.HTTP_503_SERVICE_UNAVAILABLE)


class AIQuotaError(AIServiceError):
    def __init__(self) -> None:
        super().__init__(PESAN_KUOTA_AI, status.HTTP_429_TOO_MANY_REQUESTS)


class AITimeoutError(AIServiceError):
    def __init__(self) -> None:
        super().__init__(PESAN_TERLALU_LAMA, status.HTTP_504_GATEWAY_TIMEOUT)


class AIUnknownError(AIServiceError):
    def __init__(self) -> None:
        super().__init__(PESAN_UMUM, status.HTTP_500_INTERNAL_SERVER_ERROR)


class KuotaHarianHabis(AIServiceError):
    """Kuota per-user (Fase 5), berbeda dari kuota provider AI."""

    def __init__(self) -> None:
        super().__init__(PESAN_KUOTA_USER, status.HTTP_429_TOO_MANY_REQUESTS)


class KuotaBulananHabis(AIServiceError):
    """Batas sebulan. Ini yang benar-benar menjaga biaya model lifetime."""

    def __init__(self) -> None:
        super().__init__(PESAN_KUOTA_BULANAN, status.HTTP_429_TOO_MANY_REQUESTS)


class KuotaEndpointHabis(AIServiceError):
    """Batas satu alat saja; alat lain tetap terbuka."""

    def __init__(self, pesan: str = PESAN_KUOTA_ENDPOINT) -> None:
        super().__init__(pesan, status.HTTP_429_TOO_MANY_REQUESTS)


# Kalimat khusus per endpoint. Yang tidak terdaftar memakai kalimat umum.
PESAN_PER_ENDPOINT = {"carousel-content": PESAN_KUOTA_CAROUSEL}


def _ratakan_pesan_validasi(detail: Any) -> str | None:
    """Ambil satu pesan validasi pertama dari struktur error DRF."""
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list):
        for item in detail:
            pesan = _ratakan_pesan_validasi(item)
            if pesan:
                return pesan
        return None
    if isinstance(detail, dict):
        # Nama field sengaja TIDAK ikut ditampilkan: field request memakai nama
        # Inggris (itemName, portionWeight) yang dikunci kontrak API, dan itu
        # tidak boleh bocor ke layar. Sebagai gantinya, setiap serializer wajib
        # menulis error_messages yang sudah menyebut isiannya sendiri dalam
        # Bahasa Indonesia, mis. "Nama menu belum diisi."
        for isi in detail.values():
            pesan = _ratakan_pesan_validasi(isi)
            if pesan:
                return pesan
        return None
    return None


def indonesian_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """Exception handler DRF: satu bentuk respons, selalu Bahasa Indonesia."""
    if isinstance(exc, AIServiceError):
        logger.warning("Kegagalan layanan AI: %s", exc, exc_info=True)
        return Response({"error": exc.pesan}, status=exc.status_code)

    response = drf_exception_handler(exc, context)

    if response is None:
        logger.exception("Exception tidak tertangani")
        return Response({"error": PESAN_UMUM}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    kode = response.status_code

    if kode == status.HTTP_400_BAD_REQUEST:
        pesan = _ratakan_pesan_validasi(response.data) or "Ada isian yang belum benar."
        return Response({"error": pesan}, status=kode)
    if kode in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN):
        # 403 dari DRF untuk request tanpa kredensial tetap berarti "belum masuk".
        belum_masuk = not getattr(context.get("request"), "user", None)
        pesan = PESAN_BELUM_MASUK if (kode == 401 or belum_masuk) else PESAN_TIDAK_BOLEH
        return Response({"error": pesan}, status=kode)
    if kode == status.HTTP_404_NOT_FOUND:
        return Response({"error": PESAN_TIDAK_ADA}, status=kode)
    if kode == status.HTTP_429_TOO_MANY_REQUESTS:
        return Response({"error": PESAN_TERLALU_CEPAT}, status=kode)
    if kode == status.HTTP_405_METHOD_NOT_ALLOWED:
        return Response({"error": PESAN_UMUM}, status=kode)

    logger.error("Respons error tak terpetakan (%s): %s", kode, response.data)
    return Response({"error": PESAN_UMUM}, status=kode)
