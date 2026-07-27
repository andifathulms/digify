"""Test kuota harian — pengaman biaya untuk model lifetime.

Kalau test di berkas ini gagal, artinya seseorang bisa memakai AI tanpa batas
setelah membayar sekali. Itu risiko biaya terbuka, bukan sekadar bug.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.ai.errors import AIBusyError
from apps.usage.kuota import sisa_kuota
from apps.usage.models import DailyQuota, UsageLog

pytestmark = pytest.mark.django_db

# Dipakai endpoint AI sungguhan. Tab 1-6 sengaja TIDAK dipakai di sini: sejak
# Profit Engine jadi berbasis aturan, endpoint-endpoint itu tidak berbiaya dan
# memang tidak memotong kuota (diuji terpisah di test_aturan_*.py).
ENDPOINT = "/api/marketing-content"
TARGET_GEMINI = "apps.optimizer.features.marketing_content.call_gemini"

PERMINTAAN = {
    "namaMenu": "Es Kopi Susu Gula Aren",
    "keunggulan": "Gula aren asli, kopi dari petani lokal",
}

JAWABAN = {
    "caption_utama": "Manisnya pas, kopinya nendang.",
    "caption_alternatif": ["Sore-sore paling enak begini."],
    "hashtag_rekomendasi": ["#kopisusu"],
    "ide_visual": "Foto gelas dari dekat.",
    "call_to_action": "Pesan lewat WhatsApp.",
    "waktu_posting_ideal": "Sore jam 16.00.",
}


@pytest.fixture
def user() -> User:
    return User.objects.create_user(email="budi@warung.id", password="rahasia-test-123")


@pytest.fixture
def client(user: User) -> APIClient:
    klien = APIClient()
    klien.force_authenticate(user=user)
    return klien


def panggil(client: APIClient):
    with patch(TARGET_GEMINI, return_value=dict(JAWABAN)):
        return client.post(ENDPOINT, PERMINTAAN, format="json")


class TestPencatatan:
    def test_panggilan_berhasil_dicatat_dan_menaikkan_kuota(
        self, client: APIClient, user: User
    ) -> None:
        assert panggil(client).status_code == 200

        catatan = UsageLog.objects.get()
        assert catatan.user == user
        assert catatan.endpoint == "marketing-content"
        assert catatan.status == UsageLog.Status.OK

        assert DailyQuota.objects.get(user=user).count == 1

    def test_panggilan_gagal_tetap_dicatat_dan_tetap_memotong_kuota(
        self, client: APIClient, user: User
    ) -> None:
        """Panggilan gagal tetap membebani kuota Gemini. Kalau tidak dipotong,
        klik berulang saat server AI bermasalah jadi tidak terbatas."""
        with patch(TARGET_GEMINI, side_effect=AIBusyError()):
            respons = client.post(ENDPOINT, PERMINTAAN, format="json")

        assert respons.status_code == 503
        assert UsageLog.objects.get().status == UsageLog.Status.ERROR
        assert DailyQuota.objects.get(user=user).count == 1

    def test_sisa_kuota_dikirim_di_header(self, client: APIClient, settings) -> None:  # noqa: ANN001
        settings.DAILY_AI_QUOTA = 50
        respons = panggil(client)
        assert respons["X-Sisa-Kuota"] == "49"


class TestBatasHarian:
    def test_melewati_batas_mendapat_429_berbahasa_indonesia(
        self, client: APIClient, user: User, settings
    ) -> None:  # noqa: ANN001
        """Kriteria selesai Fase 5."""
        settings.DAILY_AI_QUOTA = 2

        assert panggil(client).status_code == 200
        assert panggil(client).status_code == 200

        ketiga = panggil(client)
        assert ketiga.status_code == 429
        assert ketiga.json() == {
            "error": "Kuota harian Anda sudah habis. Reset otomatis besok pagi."
        }

    def test_yang_ditolak_kuota_tidak_memanggil_gemini_sama_sekali(
        self, client: APIClient, settings
    ) -> None:  # noqa: ANN001
        """Kalau kuota diperiksa setelah Gemini dihubungi, biayanya sudah
        terlanjur keluar dan penolakannya jadi tidak ada gunanya."""
        settings.DAILY_AI_QUOTA = 1
        panggil(client)

        with patch(TARGET_GEMINI, return_value=dict(JAWABAN)) as gemini:
            assert client.post(ENDPOINT, PERMINTAAN, format="json").status_code == 429

        gemini.assert_not_called()

    def test_penolakan_kuota_tidak_menambah_hitungan(
        self, client: APIClient, user: User, settings
    ) -> None:  # noqa: ANN001
        settings.DAILY_AI_QUOTA = 1
        panggil(client)
        panggil(client)  # ditolak

        assert DailyQuota.objects.get(user=user).count == 1

    def test_kuota_dihitung_per_user(self, settings) -> None:  # noqa: ANN001
        """Kuota user lain yang habis tidak boleh ikut memblokir user ini."""
        settings.DAILY_AI_QUOTA = 1

        budi = User.objects.create_user(email="budi@warung.id", password="rahasia-test-123")
        siti = User.objects.create_user(email="siti@warung.id", password="rahasia-test-123")

        klien_budi = APIClient()
        klien_budi.force_authenticate(user=budi)
        klien_siti = APIClient()
        klien_siti.force_authenticate(user=siti)

        assert panggil(klien_budi).status_code == 200
        assert panggil(klien_budi).status_code == 429
        assert panggil(klien_siti).status_code == 200

    def test_staff_tidak_dibatasi(self, settings) -> None:  # noqa: ANN001
        """Owner perlu bisa mencoba dan mendemokan produknya sendiri."""
        settings.DAILY_AI_QUOTA = 1
        owner = User.objects.create_user(
            email="owner@digify.id", password="rahasia-test-123", is_staff=True
        )
        klien = APIClient()
        klien.force_authenticate(user=owner)

        assert panggil(klien).status_code == 200
        assert panggil(klien).status_code == 200

    def test_sisa_kuota_tidak_pernah_minus(self, user: User, settings) -> None:  # noqa: ANN001
        settings.DAILY_AI_QUOTA = 1
        DailyQuota.objects.create(user=user, count=99)
        assert sisa_kuota(user) == 0
