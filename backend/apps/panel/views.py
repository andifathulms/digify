"""Endpoint panel pengawasan.

View tetap tipis (CLAUDE.md §6): periksa izin, panggil fungsi laporan atau
tindakan, kembalikan Response. Hitungannya ada di laporan.py, tindakannya di
tindakan.py.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.panel import laporan, tindakan
from apps.panel.izin import BolehLihatPanel, BolehUbahKuota, BolehUrusAkun

User = get_user_model()


class RingkasanView(APIView):
    permission_classes = [BolehLihatPanel]

    def get(self, request: Request) -> Response:
        return Response(laporan.ringkasan())


class DaftarKlienView(APIView):
    permission_classes = [BolehLihatPanel]

    def get(self, request: Request) -> Response:
        cari = request.query_params.get("cari", "").strip()
        return Response({"klien": laporan.daftar_klien(cari)})


class DetailKlienView(APIView):
    permission_classes = [BolehLihatPanel]

    def get(self, request: Request, user_id: int) -> Response:
        klien = get_object_or_404(User, pk=user_id, is_staff=False)
        return Response(laporan.detail_klien(klien))


class WebhookBermasalahView(APIView):
    permission_classes = [BolehLihatPanel]

    def get(self, request: Request) -> Response:
        return Response({"peristiwa": laporan.webhook_bermasalah()})


class BonusKuotaView(APIView):
    """Tambah jatah pemakaian seorang pembeli untuk hari ini."""

    permission_classes = [BolehUbahKuota]

    def post(self, request: Request, user_id: int) -> Response:
        klien = get_object_or_404(User, pk=user_id, is_staff=False)
        hasil = tindakan.beri_bonus_kuota(
            klien,
            jumlah=request.data.get("jumlah"),
            alasan=str(request.data.get("alasan", ""))[:200],
            oleh=request.user,
        )
        return Response(hasil)


class ResetKataSandiView(APIView):
    """Buatkan kata sandi baru untuk pembeli yang tidak bisa masuk.

    Kata sandinya dikembalikan SEKALI di sini supaya operasional bisa
    mengirimkannya lewat WhatsApp. Tidak disimpan di mana pun dalam bentuk yang
    bisa dibaca ulang.
    """

    permission_classes = [BolehUrusAkun]

    def post(self, request: Request, user_id: int) -> Response:
        klien = get_object_or_404(User, pk=user_id, is_staff=False)
        return Response(tindakan.reset_kata_sandi(klien))


class UbahAktifView(APIView):
    """Nonaktifkan atau aktifkan kembali sebuah akun.

    Menonaktifkan, bukan menghapus: pembeli yang dihapus tidak bisa
    dikembalikan, dan riwayat pemakaiannya ikut hilang bersama alasan kenapa
    ia dihapus.
    """

    permission_classes = [BolehUrusAkun]

    def post(self, request: Request, user_id: int) -> Response:
        klien = get_object_or_404(User, pk=user_id, is_staff=False)
        return Response(tindakan.ubah_aktif(klien, aktif=bool(request.data.get("aktif"))))
