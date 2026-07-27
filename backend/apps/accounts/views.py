"""Endpoint akun, sesi, dan webhook pembayaran.

Tidak ada pendaftaran mandiri. Akun hanya lahir dari webhook pembayaran atau
dari perintah `manage.py buat_akun` (PRD §8.2).
"""

from __future__ import annotations

import json
import logging
from typing import Any

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.accounts.serializers import (
    GantiKataSandiSerializer,
    MasukSerializer,
    ProfilSerializer,
)
from apps.accounts.webhook import proses_pembayaran, tanda_tangan_sah

logger = logging.getLogger(__name__)


def _token_untuk(user: User) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class MasukView(APIView):
    """POST /api/auth/masuk — tukar email + kata sandi jadi token."""

    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        serializer = MasukSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        return Response(
            {
                **_token_untuk(user),
                "profil": ProfilSerializer(user).data,
            }
        )


class SegarkanView(APIView):
    """POST /api/auth/segarkan — tukar refresh token jadi access token baru."""

    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        refresh_mentah = request.data.get("refresh")
        if not refresh_mentah:
            return Response(
                {"error": "Sesi Anda sudah berakhir. Silakan masuk lagi."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(refresh_mentah)
            return Response({"access": str(refresh.access_token)})
        except TokenError:
            return Response(
                {"error": "Sesi Anda sudah berakhir. Silakan masuk lagi."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class ProfilView(APIView):
    """GET /api/auth/saya — siapa yang sedang masuk."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(ProfilSerializer(request.user).data)


class GantiKataSandiView(APIView):
    """POST /api/auth/ganti-kata-sandi — wajib dilakukan saat pertama masuk."""

    permission_classes = [IsAuthenticated]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        serializer = GantiKataSandiSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user: User = request.user
        user.set_password(serializer.validated_data["kata_sandi_baru"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        # Kata sandi berubah → terbitkan token baru supaya sesi tetap hidup.
        return Response({**_token_untuk(user), "profil": ProfilSerializer(user).data})


class WebhookAffiliateIdView(APIView):
    """POST /api/webhooks/affiliate-id — pembayaran masuk jadi akun."""

    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_classes: list = []  # penyedia pembayaran tidak boleh kena throttle

    def post(self, request: Request) -> Response:
        isi_mentah: bytes = request.body
        tanda_tangan = request.headers.get("X-Signature", "")

        if not tanda_tangan_sah(isi_mentah, tanda_tangan):
            logger.warning("Webhook dengan tanda tangan tidak sah ditolak.")
            return Response({"error": "Tanda tangan tidak sah."}, status=status.HTTP_403_FORBIDDEN)

        try:
            payload: dict[str, Any] = json.loads(isi_mentah or b"{}")
        except json.JSONDecodeError:
            return Response({"error": "Isi kiriman tidak terbaca."}, status=400)

        order_id = str(payload.get("order_id", "")).strip()
        email = str(payload.get("email", "")).strip()
        if not order_id or not email:
            return Response({"error": "Kiriman tidak memuat order_id atau email."}, status=400)

        hasil = proses_pembayaran(
            external_id=str(payload.get("event_id") or order_id),
            order_id=order_id,
            email=email,
            payload=payload,
            nama=str(payload.get("name", "")),
            whatsapp=str(payload.get("whatsapp", "")),
            amount=float(payload.get("amount") or 0),
            signature_valid=True,
        )

        # Selalu 200, termasuk untuk kiriman ulang. Membalas error membuat
        # penyedia mengirim ulang terus-menerus.
        return Response(
            {
                "status": "ok",
                "dibuat_baru": hasil.dibuat_baru,
                # Kata sandi awal hanya muncul sekali, saat akun benar-benar
                # baru dibuat. Ini yang dikirim ke pembeli lewat email/WhatsApp.
                "kata_sandi_awal": hasil.kata_sandi_awal,
                "license_key": hasil.license.key if hasil.license else None,
            }
        )
