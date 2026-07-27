"""Endpoint daftar menu tersimpan.

GET  /api/menu  → daftar menu milik user yang sedang masuk
PUT  /api/menu  → simpan seluruh daftar sekaligus (ganti isi lama)

Sengaja "ganti semua", bukan tambah/ubah/hapus satu per satu: yang dipegang
frontend memang seluruh daftar (form Tab 3 dan 4 mengedit tabel utuh), dan
menyinkronkan per baris hanya menambah cara untuk tidak sinkron.
"""

from __future__ import annotations

from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import MenuItem
from apps.catalog.serializers import MenuItemSerializer, SimpanMenuSerializer


class MenuView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        menu = MenuItem.objects.filter(user=request.user)
        return Response({"menu": MenuItemSerializer(menu, many=True).data})

    def put(self, request: Request) -> Response:
        serializer = SimpanMenuSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Hapus-lalu-tulis di dalam satu transaksi: kalau penulisan gagal
            # di tengah, daftar lama user tidak ikut hilang.
            MenuItem.objects.filter(user=request.user).delete()
            MenuItem.objects.bulk_create(
                [
                    MenuItem(user=request.user, **baris)
                    for baris in serializer.validated_data["menu"]
                ]
            )

        menu = MenuItem.objects.filter(user=request.user)
        return Response({"menu": MenuItemSerializer(menu, many=True).data})
