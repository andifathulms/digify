"""Penjagaan akses panel.

Penjagaan SESUNGGUHNYA ada di sini, bukan di frontend. Halaman Next.js boleh
menyembunyikan menu yang pasti gagal, tapi itu kenyamanan — siapa pun bisa
memanggil endpoint ini langsung.
"""

from __future__ import annotations

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class BolehLihatPanel(BasePermission):
    """Boleh masuk panel kalau ia orang dalam DAN memang boleh melihat pembeli.

    Dua syarat, bukan satu. `is_staff` sendiri cuma berarti "orang dalam";
    izin `accounts.view_user` yang menyatakan ia memang bertugas mengurus
    pembeli. Menggabungkan keduanya berarti setiap akun internal masa depan —
    apa pun tugasnya — otomatis bisa membaca data seluruh pembeli.
    """

    message = "Anda belum punya akses ke bagian ini."

    def has_permission(self, request: Request, view: APIView) -> bool:
        pengguna = request.user
        return bool(
            pengguna
            and pengguna.is_authenticated
            and pengguna.is_staff
            and pengguna.has_perm("accounts.view_user")
        )


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
