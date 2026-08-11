"""Penjagaan akses panel.

Penjagaan SESUNGGUHNYA ada di sini, bukan di frontend. Halaman Next.js boleh
menyembunyikan menu yang pasti gagal, tapi itu kenyamanan — siapa pun bisa
memanggil endpoint ini langsung.
"""

from __future__ import annotations

from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


def boleh_lihat_panel(pengguna: Any) -> bool:
    """Satu tempat yang memutuskan siapa boleh masuk panel.

    Dipakai oleh kelas izin DRF DAN oleh profil yang dibaca frontend untuk
    memutuskan menampilkan menunya. Ditulis sekali supaya keduanya tidak bisa
    berselisih — menu yang muncul tapi selalu ditolak, atau lebih buruk, menu
    yang disembunyikan padahal orangnya berhak.
    """
    return bool(
        pengguna
        and pengguna.is_authenticated
        and pengguna.is_staff
        and pengguna.has_perm("accounts.view_user")
    )


class BolehLihatPanel(BasePermission):
    """Boleh masuk panel kalau ia orang dalam DAN memang boleh melihat pembeli.

    Dua syarat, bukan satu. `is_staff` sendiri cuma berarti "orang dalam";
    izin `accounts.view_user` yang menyatakan ia memang bertugas mengurus
    pembeli. Menggabungkan keduanya berarti setiap akun internal masa depan —
    apa pun tugasnya — otomatis bisa membaca data seluruh pembeli.
    """

    message = "Anda belum punya akses ke bagian ini."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return boleh_lihat_panel(request.user)


class BolehUbahKuota(BolehLihatPanel):
    """Untuk tindakan yang mengubah jatah pemakaian seseorang."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        return super().has_permission(request, view) and request.user.has_perm(
            "usage.change_dailyquota"
        )


class BolehUrusAkun(BolehLihatPanel):
    """Untuk tindakan yang menyentuh akun: reset kata sandi, buat akun manual."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        return super().has_permission(request, view) and request.user.has_perm(
            "accounts.change_user"
        )
