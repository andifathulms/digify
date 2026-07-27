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


class EndpointAI(APIView):
    """Base view: satu serializer masuk, satu fungsi fitur, satu Response keluar."""

    # Seluruh endpoint AI wajib login. Tiap panggilan memakai kuota Gemini
    # berbayar; membiarkannya terbuka berarti siapa pun bisa menghabiskan
    # tagihan Owner (PRD §8.3).
    permission_classes = [IsAuthenticated]

    # Throttle burst dari REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["ai"].
    throttle_scope = "ai"

    serializer_class: type[serializers.Serializer]
    # Wajib dibungkus staticmethod di subclass, supaya tidak ikut ter-bind ke self.
    feature: Callable[[dict[str, Any]], dict[str, Any]]

    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        hasil = self.feature(serializer.validated_data)
        return Response(hasil)
