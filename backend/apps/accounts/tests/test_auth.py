"""Test akun, sesi, dan webhook pembayaran.

Yang dijaga di sini adalah dua hal yang kalau bocor langsung berarti uang:
webhook yang membuat akun ganda, dan endpoint AI yang bisa dipakai tanpa masuk.
"""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import License, User, WebhookEvent

pytestmark = pytest.mark.django_db

RAHASIA = "rahasia-webhook-untuk-test"


@pytest.fixture(autouse=True)
def rahasia_webhook(settings) -> None:  # noqa: ANN001
    settings.AFFILIATE_ID_WEBHOOK_SECRET = RAHASIA


@pytest.fixture
def client() -> APIClient:
    return APIClient()


def kirim_webhook(client: APIClient, payload: dict[str, Any], *, rahasia: str = RAHASIA):
    isi = json.dumps(payload)
    tanda_tangan = hmac.new(rahasia.encode(), isi.encode(), hashlib.sha256).hexdigest()
    return client.post(
        "/api/webhooks/affiliate-id",
        data=isi,
        content_type="application/json",
        HTTP_X_SIGNATURE=tanda_tangan,
    )


PEMBAYARAN = {
    "event_id": "evt_001",
    "order_id": "ORD-2026-0001",
    "email": "budi@warung.id",
    "name": "Pak Budi",
    "whatsapp": "081234567890",
    "amount": 249000,
}


class TestWebhookPembayaran:
    def test_pembayaran_sah_membuat_satu_akun_aktif(self, client: APIClient) -> None:
        respons = kirim_webhook(client, PEMBAYARAN)

        assert respons.status_code == 200
        assert respons.json()["dibuat_baru"] is True

        user = User.objects.get(email="budi@warung.id")
        assert user.is_active is True
        # Kata sandi acak dikirim lewat email/WhatsApp, jadi wajib diganti.
        assert user.must_change_password is True

        lisensi = License.objects.get(order_id="ORD-2026-0001")
        assert lisensi.status == License.Status.ACTIVE
        assert lisensi.user == user
        assert lisensi.activated_at is not None

    def test_kata_sandi_awal_hanya_dikembalikan_sekali(self, client: APIClient) -> None:
        pertama = kirim_webhook(client, PEMBAYARAN)
        assert pertama.json()["kata_sandi_awal"]

        ulang = kirim_webhook(client, {**PEMBAYARAN, "event_id": "evt_lain"})
        assert ulang.json()["kata_sandi_awal"] is None

    def test_webhook_sama_dikirim_tiga_kali_tetap_satu_akun(self, client: APIClient) -> None:
        """Kriteria selesai Fase 4. Penyedia pembayaran memang mengirim ulang
        kalau balasannya terlambat; itu normal, bukan serangan."""
        for _ in range(3):
            respons = kirim_webhook(client, PEMBAYARAN)
            assert respons.status_code == 200

        assert User.objects.filter(email="budi@warung.id").count() == 1
        assert License.objects.filter(order_id="ORD-2026-0001").count() == 1
        assert WebhookEvent.objects.count() == 1

    def test_pesanan_sama_dengan_event_id_berbeda_tetap_satu_lisensi(
        self, client: APIClient
    ) -> None:
        """Penyedia bisa memberi event_id baru untuk pesanan yang sama.
        order_id yang unik adalah pertahanan terakhirnya."""
        kirim_webhook(client, PEMBAYARAN)
        respons = kirim_webhook(client, {**PEMBAYARAN, "event_id": "evt_002"})

        assert respons.status_code == 200
        assert respons.json()["dibuat_baru"] is False
        assert License.objects.filter(order_id="ORD-2026-0001").count() == 1
        assert User.objects.filter(email="budi@warung.id").count() == 1

    def test_kiriman_ulang_tetap_dibalas_200(self, client: APIClient) -> None:
        """Membalas error membuat penyedia mengirim ulang terus-menerus."""
        kirim_webhook(client, PEMBAYARAN)
        assert kirim_webhook(client, PEMBAYARAN).status_code == 200

    def test_tanda_tangan_salah_ditolak_dan_tidak_membuat_apa_pun(self, client: APIClient) -> None:
        respons = kirim_webhook(client, PEMBAYARAN, rahasia="rahasia-yang-salah")

        assert respons.status_code == 403
        assert User.objects.count() == 0
        assert License.objects.count() == 0
        assert WebhookEvent.objects.count() == 0

    def test_tanpa_tanda_tangan_ditolak(self, client: APIClient) -> None:
        respons = client.post(
            "/api/webhooks/affiliate-id",
            data=json.dumps(PEMBAYARAN),
            content_type="application/json",
        )
        assert respons.status_code == 403
        assert User.objects.count() == 0

    def test_rahasia_belum_diisi_menolak_semua_webhook(self, client: APIClient, settings) -> None:  # noqa: ANN001
        """Server yang lupa mengisi rahasia harus menolak, bukan menerima
        semuanya tanpa pemeriksaan."""
        settings.AFFILIATE_ID_WEBHOOK_SECRET = ""
        assert kirim_webhook(client, PEMBAYARAN, rahasia="").status_code == 403

    def test_kiriman_tanpa_order_id_ditolak(self, client: APIClient) -> None:
        respons = kirim_webhook(client, {"event_id": "evt_x", "email": "a@b.id"})
        assert respons.status_code == 400
        assert User.objects.count() == 0


class TestMasuk:
    @pytest.fixture
    def user(self) -> User:
        return User.objects.create_user(
            email="budi@warung.id", password="kata-sandi-awal-123", full_name="Pak Budi"
        )

    def test_masuk_berhasil_memberi_token(self, client: APIClient, user: User) -> None:
        respons = client.post(
            "/api/auth/masuk",
            {"email": "budi@warung.id", "kata_sandi": "kata-sandi-awal-123"},
            format="json",
        )

        assert respons.status_code == 200
        data = respons.json()
        assert data["access"] and data["refresh"]
        assert data["profil"]["email"] == "budi@warung.id"

    def test_email_boleh_huruf_besar(self, client: APIClient, user: User) -> None:
        respons = client.post(
            "/api/auth/masuk",
            {"email": "Budi@Warung.ID", "kata_sandi": "kata-sandi-awal-123"},
            format="json",
        )
        assert respons.status_code == 200

    def test_kata_sandi_salah_dan_email_asing_memberi_pesan_yang_sama(
        self, client: APIClient, user: User
    ) -> None:
        """Pesan yang berbeda memberi tahu orang asing bahwa sebuah email
        terdaftar di sini."""
        salah_sandi = client.post(
            "/api/auth/masuk",
            {"email": "budi@warung.id", "kata_sandi": "salah"},
            format="json",
        )
        email_asing = client.post(
            "/api/auth/masuk",
            {"email": "orang@lain.id", "kata_sandi": "salah"},
            format="json",
        )

        assert salah_sandi.status_code == 400
        assert salah_sandi.json() == email_asing.json()
        assert salah_sandi.json() == {"error": "Email atau kata sandi belum cocok."}

    def test_akun_nonaktif_tidak_bisa_masuk(self, client: APIClient, user: User) -> None:
        """Pesannya sengaja sama dengan kata sandi salah: pesan khusus "akun
        nonaktif" sama saja memberitahu bahwa email itu terdaftar di sini."""
        user.is_active = False
        user.save(update_fields=["is_active"])

        respons = client.post(
            "/api/auth/masuk",
            {"email": "budi@warung.id", "kata_sandi": "kata-sandi-awal-123"},
            format="json",
        )
        assert respons.status_code == 400
        assert respons.json() == {"error": "Email atau kata sandi belum cocok."}


class TestGantiKataSandi:
    @pytest.fixture
    def user(self) -> User:
        return User.objects.create_user(
            email="budi@warung.id", password="sandi-lama-123", must_change_password=True
        )

    def test_ganti_kata_sandi_mematikan_tanda_wajib_ganti(
        self, client: APIClient, user: User
    ) -> None:
        client.force_authenticate(user=user)
        respons = client.post(
            "/api/auth/ganti-kata-sandi",
            {"kata_sandi_lama": "sandi-lama-123", "kata_sandi_baru": "sandi-baru-4567"},
            format="json",
        )

        assert respons.status_code == 200
        user.refresh_from_db()
        assert user.must_change_password is False
        assert user.check_password("sandi-baru-4567")

    def test_kata_sandi_lama_salah_ditolak(self, client: APIClient, user: User) -> None:
        client.force_authenticate(user=user)
        respons = client.post(
            "/api/auth/ganti-kata-sandi",
            {"kata_sandi_lama": "bukan-ini", "kata_sandi_baru": "sandi-baru-4567"},
            format="json",
        )
        assert respons.status_code == 400
        assert respons.json() == {"error": "Kata sandi lama belum cocok."}

    def test_kata_sandi_baru_terlalu_lemah_ditolak_dalam_bahasa_indonesia(
        self, client: APIClient, user: User
    ) -> None:
        client.force_authenticate(user=user)
        respons = client.post(
            "/api/auth/ganti-kata-sandi",
            {"kata_sandi_lama": "sandi-lama-123", "kata_sandi_baru": "12345678"},
            format="json",
        )
        assert respons.status_code == 400
        assert "mudah ditebak" in respons.json()["error"]


class TestEndpointAIWajibMasuk:
    """Kriteria selesai Fase 4: endpoint AI menolak request tanpa token.

    Tiap panggilan memakai kuota Gemini berbayar. Endpoint yang terbuka berarti
    siapa pun bisa menghabiskan tagihan Owner.
    """

    ENDPOINT_AI = [
        "cost-calculator",
        "pricing",
        "ranking",
        "menu-engineering",
        "export",
        "waste-tracker",
        "menu-ideas",
        "marketing-content",
        "carousel-content",
    ]

    @pytest.mark.parametrize("endpoint", ENDPOINT_AI)
    def test_tanpa_token_ditolak(self, client: APIClient, endpoint: str) -> None:
        respons = client.post(f"/api/{endpoint}", {}, format="json")

        assert respons.status_code in (401, 403)
        # Pesannya tetap Bahasa Indonesia, bukan "Authentication credentials
        # were not provided."
        assert respons.json() == {"error": "Sesi Anda sudah berakhir. Silakan masuk lagi."}

    def test_health_tetap_terbuka(self, client: APIClient) -> None:
        """Frontend memakai health untuk badge "Server aktif" di halaman
        yang belum tentu sudah login."""
        assert client.get("/api/health").status_code == 200
