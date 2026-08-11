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

    def test_owner_tidak_dibatasi(self, settings) -> None:  # noqa: ANN001
        """Owner perlu bisa mencoba dan mendemokan produknya sendiri.

        Superuser, bukan sekadar is_staff — sejak 11 Agustus 2026 kuota
        dilewati lewat izin `usage.bypass_quota`, dan akses admin saja tidak
        lagi cukup. Lihat TestSisaKuotaYangDitampilkan untuk penjaganya.
        """
        settings.DAILY_AI_QUOTA = 1
        owner = User.objects.create_superuser(email="owner@digify.id", password="rahasia-test-123")
        klien = APIClient()
        klien.force_authenticate(user=owner)

        assert panggil(klien).status_code == 200
        assert panggil(klien).status_code == 200

    def test_sisa_kuota_tidak_pernah_minus(self, user: User, settings) -> None:  # noqa: ANN001
        settings.DAILY_AI_QUOTA = 1
        DailyQuota.objects.create(user=user, count=99)
        assert sisa_kuota(user) == 0


# --- Batas bulanan dan batas per alat (11 Agustus 2026) --------------------
#
# Batas harian saja masih mengizinkan ~600 panggilan sebulan. Yang membakar
# uang bukan satu hari sibuk, melainkan pemakaian penuh yang diulang tiap hari
# — dan pembelinya hanya membayar sekali, seumur hidup.

ENDPOINT_CAROUSEL = "/api/carousel-content"
TARGET_GEMINI_CAROUSEL = "apps.optimizer.features.carousel_content.call_gemini"

PERMINTAAN_CAROUSEL = {
    "namaMenu": "Es Kopi Susu Gula Aren",
    "keunggulan": "Gula aren asli, kopi dari petani lokal",
    "jumlahSlide": 4,
}

JAWABAN_CAROUSEL = {
    "ringkasan_konsep": "Cerita empat slide.",
    "slides": [
        {
            "nomor_slide": nomor,
            "tipe_slide": "Pembuka",
            "teks_slide": "Teks slide.",
            "petunjuk_foto": "Foto gelas.",
        }
        for nomor in range(1, 5)
    ],
    "caption_post": "Caption.",
    "hashtag_rekomendasi": ["#kopisusu"],
}


def panggil_carousel(client: APIClient):
    with patch(TARGET_GEMINI_CAROUSEL, return_value=dict(JAWABAN_CAROUSEL)):
        return client.post(ENDPOINT_CAROUSEL, PERMINTAAN_CAROUSEL, format="json")


class TestBatasBulanan:
    def test_melewati_batas_bulanan_mendapat_429_berbahasa_indonesia(
        self, client: APIClient, user: User, settings
    ) -> None:  # noqa: ANN001
        settings.DAILY_AI_QUOTA = 100  # dilonggarkan supaya yang diuji memang batas bulanan
        settings.MONTHLY_AI_QUOTA = 2

        assert panggil(client).status_code == 200
        assert panggil(client).status_code == 200

        ketiga = panggil(client)
        assert ketiga.status_code == 429
        assert ketiga.json() == {
            "error": "Kuota bulan ini sudah habis. Jatahnya terisi lagi otomatis awal bulan depan."
        }

    def test_pemakaian_hari_lain_dalam_bulan_yang_sama_ikut_dihitung(
        self, client: APIClient, user: User, settings
    ) -> None:  # noqa: ANN001
        """Inti dari batas bulanan: jatah kemarin tidak hilang saat hari berganti."""
        from django.utils import timezone

        settings.DAILY_AI_QUOTA = 100
        settings.MONTHLY_AI_QUOTA = 3

        hari_ini = timezone.localdate()
        awal_bulan = hari_ini.replace(day=1)
        if awal_bulan == hari_ini:
            # Tanggal 1: tidak ada "hari sebelumnya" di bulan ini, jadi
            # pemakaian lama ditaruh di hari ini juga.
            DailyQuota.objects.create(user=user, date=hari_ini, count=3)
        else:
            DailyQuota.objects.create(user=user, date=awal_bulan, count=3)

        assert panggil(client).status_code == 429

    def test_pemakaian_bulan_lalu_tidak_ikut_dihitung(
        self, client: APIClient, user: User, settings
    ) -> None:  # noqa: ANN001
        from datetime import timedelta

        from django.utils import timezone

        settings.DAILY_AI_QUOTA = 100
        settings.MONTHLY_AI_QUOTA = 2

        bulan_lalu = timezone.localdate().replace(day=1) - timedelta(days=1)
        DailyQuota.objects.create(user=user, date=bulan_lalu, count=99)

        assert panggil(client).status_code == 200


class TestBatasPerAlat:
    def test_carousel_punya_jatah_sendiri_yang_lebih_ketat(
        self, client: APIClient, settings
    ) -> None:  # noqa: ANN001
        settings.DAILY_AI_QUOTA = 100
        settings.MONTHLY_AI_QUOTA = 100
        settings.KUOTA_HARIAN_ENDPOINT = {"carousel-content": 2}

        assert panggil_carousel(client).status_code == 200
        assert panggil_carousel(client).status_code == 200

        ketiga = panggil_carousel(client)
        assert ketiga.status_code == 429
        assert ketiga.json() == {
            "error": (
                "Jatah membuat carousel hari ini sudah habis. Coba lagi besok — "
                "alat lain masih bisa dipakai seperti biasa."
            )
        }

    def test_jatah_carousel_habis_tidak_menutup_alat_lain(
        self, client: APIClient, settings
    ) -> None:  # noqa: ANN001
        """Alasan kalimatnya berbunyi 'alat lain masih bisa dipakai': memang begitu."""
        settings.DAILY_AI_QUOTA = 100
        settings.MONTHLY_AI_QUOTA = 100
        settings.KUOTA_HARIAN_ENDPOINT = {"carousel-content": 1}

        assert panggil_carousel(client).status_code == 200
        assert panggil_carousel(client).status_code == 429

        assert panggil(client).status_code == 200  # marketing-content, tetap boleh

    def test_alat_tanpa_jatah_khusus_tidak_dibatasi_per_alat(
        self, client: APIClient, settings
    ) -> None:  # noqa: ANN001
        settings.DAILY_AI_QUOTA = 100
        settings.MONTHLY_AI_QUOTA = 100
        settings.KUOTA_HARIAN_ENDPOINT = {"carousel-content": 1}

        for _ in range(5):
            assert panggil(client).status_code == 200

    def test_yang_ditolak_batas_alat_tidak_memanggil_gemini(
        self, client: APIClient, settings
    ) -> None:  # noqa: ANN001
        settings.DAILY_AI_QUOTA = 100
        settings.MONTHLY_AI_QUOTA = 100
        settings.KUOTA_HARIAN_ENDPOINT = {"carousel-content": 1}
        panggil_carousel(client)

        with patch(TARGET_GEMINI_CAROUSEL, return_value=dict(JAWABAN_CAROUSEL)) as gemini:
            ditolak = client.post(ENDPOINT_CAROUSEL, PERMINTAAN_CAROUSEL, format="json")

        assert ditolak.status_code == 429

        gemini.assert_not_called()


class TestSisaKuotaYangDitampilkan:
    def test_header_memakai_batas_yang_paling_ketat(self, client: APIClient, settings) -> None:  # noqa: ANN001
        """Angka yang berbohong lebih buruk daripada tidak ada angka: user tidak
        boleh melihat 'masih 99' lalu ditolak karena jatah alatnya habis."""
        settings.DAILY_AI_QUOTA = 100
        settings.MONTHLY_AI_QUOTA = 100
        settings.KUOTA_HARIAN_ENDPOINT = {"carousel-content": 5}

        respons = panggil_carousel(client)
        assert respons["X-Sisa-Kuota"] == "4"

    def test_superuser_tidak_dibatasi(self, settings) -> None:  # noqa: ANN001
        """Owner perlu bisa mendemokan produknya sendiri tanpa kehabisan jatah.

        Lolos lewat izin `usage.bypass_quota`, yang otomatis dimiliki
        superuser — bukan lewat is_staff.
        """
        settings.DAILY_AI_QUOTA = 1
        settings.MONTHLY_AI_QUOTA = 1
        settings.KUOTA_HARIAN_ENDPOINT = {"carousel-content": 1}

        owner = User.objects.create_superuser(email="owner@digify.id", password="rahasia-test-123")
        klien = APIClient()
        klien.force_authenticate(user=owner)

        for _ in range(3):
            assert panggil_carousel(klien).status_code == 200

    def test_akses_admin_saja_TIDAK_memberi_kuota_tanpa_batas(self, settings) -> None:  # noqa: ANN001
        """Penjaga regresi, dan ini alasannya dipisah.

        Dulu kuota dilewati oleh is_staff, sementara is_staff artinya "bisa
        masuk admin". Jadi memberi seorang operasional atau CS akses admin ikut
        memberinya belanja AI tanpa batas — diam-diam, pada hari aksesnya
        diberikan, tanpa ada yang menghubungkan kedua hal itu.
        """
        settings.DAILY_AI_QUOTA = 1
        settings.MONTHLY_AI_QUOTA = 100
        settings.KUOTA_HARIAN_ENDPOINT = {}

        operasional = User.objects.create_user(
            email="operasional@digify.id", password="rahasia-test-123", is_staff=True
        )
        klien = APIClient()
        klien.force_authenticate(user=operasional)

        assert panggil(klien).status_code == 200
        assert panggil(klien).status_code == 429

    def test_izin_bypass_bisa_diberikan_tanpa_akses_admin(self, settings) -> None:  # noqa: ANN001
        """Kebalikannya juga harus bisa: bebas kuota tanpa masuk admin."""
        from django.contrib.auth.models import Permission

        settings.DAILY_AI_QUOTA = 1
        settings.MONTHLY_AI_QUOTA = 100
        settings.KUOTA_HARIAN_ENDPOINT = {}

        penguji = User.objects.create_user(email="penguji@digify.id", password="rahasia-test-123")
        penguji.user_permissions.add(Permission.objects.get(codename="bypass_quota"))
        klien = APIClient()
        klien.force_authenticate(user=penguji)

        for _ in range(3):
            assert panggil(klien).status_code == 200
