"""Test panel pengawasan.

Bagian yang paling penting di berkas ini bukan angkanya, melainkan siapa yang
boleh melihatnya. Kalau test akses di sini gagal, data seluruh pembeli —
termasuk nomor WhatsApp-nya — terbuka untuk orang yang tidak berhak.
"""

from __future__ import annotations

import pytest
from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.panel.models import BonusKuota
from apps.usage.models import DailyQuota, UsageLog

pytestmark = pytest.mark.django_db

RINGKASAN = "/api/panel/ringkasan"
KLIEN = "/api/panel/klien"


@pytest.fixture
def pembeli() -> User:
    return User.objects.create_user(email="budi@warung.id", password="rahasia-test-123")


@pytest.fixture
def operasional() -> User:
    orang = User.objects.create_user(
        email="ops@digify.id", password="rahasia-test-123", is_staff=True
    )
    orang.groups.add(Group.objects.get(name="Operasional"))
    return User.objects.get(pk=orang.pk)


@pytest.fixture
def klien_ops(operasional: User) -> APIClient:
    klien = APIClient()
    klien.force_authenticate(user=operasional)
    return klien


class TestSiapaYangBolehMasuk:
    def test_tanpa_login_ditolak(self) -> None:
        assert APIClient().get(RINGKASAN).status_code in (401, 403)

    def test_pembeli_biasa_ditolak(self, pembeli: User) -> None:
        """Pembeli tidak boleh melihat data pembeli lain, apa pun caranya."""
        klien = APIClient()
        klien.force_authenticate(user=pembeli)

        assert klien.get(RINGKASAN).status_code == 403
        assert klien.get(KLIEN).status_code == 403

    def test_pesannya_bahasa_indonesia(self, pembeli: User) -> None:
        klien = APIClient()
        klien.force_authenticate(user=pembeli)
        assert klien.get(RINGKASAN).json() == {"error": "Anda belum punya akses ke bagian ini."}

    def test_staff_tanpa_izin_lihat_pembeli_tetap_ditolak(self) -> None:
        """is_staff sendiri cuma berarti 'orang dalam'. Tanpa izin mengurus
        pembeli, ia tidak otomatis boleh membaca data seluruh pembeli."""
        orang_dalam = User.objects.create_user(
            email="magang@digify.id", password="rahasia-test-123", is_staff=True
        )
        klien = APIClient()
        klien.force_authenticate(user=orang_dalam)

        assert klien.get(RINGKASAN).status_code == 403

    def test_operasional_boleh(self, klien_ops: APIClient) -> None:
        assert klien_ops.get(RINGKASAN).status_code == 200

    def test_owner_boleh(self) -> None:
        owner = User.objects.create_superuser(email="owner@digify.id", password="rahasia-test-123")
        klien = APIClient()
        klien.force_authenticate(user=owner)
        assert klien.get(RINGKASAN).status_code == 200


class TestRingkasan:
    def test_menghitung_biaya_dari_token_bukan_dari_jumlah_panggilan(
        self, klien_ops: APIClient, pembeli: User, settings
    ) -> None:  # noqa: ANN001
        """Menghitung panggilan tidak cukup: satu carousel 10 slide memakai
        dua kali lipat token carousel 4 slide."""
        settings.HARGA_TOKEN_MASUK_PER_JUTA = 1_000_000
        settings.HARGA_TOKEN_KELUAR_PER_JUTA = 2_000_000

        UsageLog.objects.create(
            user=pembeli,
            endpoint="carousel-content",
            status=UsageLog.Status.OK,
            prompt_tokens=10,
            output_tokens=20,
        )

        data = klien_ops.get(RINGKASAN).json()
        # 10 token masuk × Rp1 + 20 token keluar × Rp2 = Rp50
        assert data["biaya_bulan_ini_rupiah"] == 50
        assert data["panggilan_bulan_ini"] == 1

    def test_menghitung_pembeli_yang_belum_pernah_masuk(
        self, klien_ops: APIClient, pembeli: User
    ) -> None:
        """Sudah bayar tapi belum pernah masuk = kredensialnya mungkin tidak sampai."""
        data = klien_ops.get(RINGKASAN).json()
        assert data["belum_pernah_masuk"] == 1

        pembeli.last_login = timezone.now()
        pembeli.save(update_fields=["last_login"])
        assert klien_ops.get(RINGKASAN).json()["belum_pernah_masuk"] == 0

    def test_kesehatan_ai_dari_rasio_gagal(self, klien_ops: APIClient, pembeli: User) -> None:
        for status in [UsageLog.Status.OK, UsageLog.Status.ERROR]:
            UsageLog.objects.create(user=pembeli, endpoint="menu-ideas", status=status)

        kesehatan = klien_ops.get(RINGKASAN).json()["kesehatan_ai"]
        assert kesehatan["panggilan_24jam"] == 2
        assert kesehatan["gagal_24jam"] == 1
        assert kesehatan["persen_gagal_24jam"] == 50

    def test_tidak_pecah_saat_belum_ada_data_sama_sekali(self, klien_ops: APIClient) -> None:
        """Hari pertama sebuah pemasangan baru juga harus bisa dibuka."""
        data = klien_ops.get(RINGKASAN).json()
        assert data["biaya_bulan_ini_rupiah"] == 0
        assert data["kesehatan_ai"]["persen_gagal_24jam"] == 0


class TestDaftarKlien:
    def test_staff_tidak_ikut_terdaftar(
        self, klien_ops: APIClient, pembeli: User, operasional: User
    ) -> None:
        """Yang diawasi pembeli. Akun internal yang tercampur membuat angkanya
        menyesatkan."""
        daftar = klien_ops.get(KLIEN).json()["klien"]
        surel = [satu["email"] for satu in daftar]

        assert pembeli.email in surel
        assert operasional.email not in surel

    def test_bisa_dicari_dengan_email_nama_atau_whatsapp(
        self, klien_ops: APIClient, pembeli: User
    ) -> None:
        pembeli.full_name = "Pak Budi"
        pembeli.whatsapp = "0812345"
        pembeli.save()

        for kata in ["budi@", "Pak Budi", "0812"]:
            hasil = klien_ops.get(KLIEN, {"cari": kata}).json()["klien"]
            assert len(hasil) == 1, kata

        assert klien_ops.get(KLIEN, {"cari": "tidak ada"}).json()["klien"] == []


class TestTindakan:
    def test_bonus_menaikkan_sisa_jatah_hari_ini(
        self, klien_ops: APIClient, pembeli: User, settings
    ) -> None:  # noqa: ANN001
        settings.DAILY_AI_QUOTA = 5
        DailyQuota.objects.create(user=pembeli, date=timezone.localdate(), count=5)

        respons = klien_ops.post(
            f"{KLIEN}/{pembeli.id}/bonus",
            {"jumlah": 3, "alasan": "pembeli komplain"},
            format="json",
        )

        assert respons.status_code == 200
        assert respons.json()["sisa_hari_ini"] == 3
        assert BonusKuota.objects.get().diberikan_oleh.email == "ops@digify.id"

    def test_bonus_menolak_angka_tidak_masuk_akal(
        self, klien_ops: APIClient, pembeli: User
    ) -> None:
        """Penjagaan terhadap salah ketik: '500' yang dimaksud '50' tidak boleh
        jadi tagihan yang tidak bisa ditarik kembali."""
        for salah in [0, -5, 500, "banyak"]:
            respons = klien_ops.post(
                f"{KLIEN}/{pembeli.id}/bonus", {"jumlah": salah}, format="json"
            )
            assert respons.status_code == 400, salah
            # Bentuk amplop galat tetap sama seperti seluruh API: satu field
            # "error", Bahasa Indonesia, tanpa nama field teknis.
            assert list(respons.json()) == ["error"], salah
            assert "harus" in respons.json()["error"], salah
        assert BonusKuota.objects.count() == 0

    def test_reset_sandi_memaksa_ganti_saat_masuk(
        self, klien_ops: APIClient, pembeli: User
    ) -> None:
        respons = klien_ops.post(f"{KLIEN}/{pembeli.id}/reset-sandi", {}, format="json")

        assert respons.status_code == 200
        sandi_baru = respons.json()["kata_sandi"]
        assert len(sandi_baru) >= 8

        pembeli.refresh_from_db()
        assert pembeli.must_change_password is True
        assert pembeli.check_password(sandi_baru)

    def test_nonaktifkan_bukan_menghapus(self, klien_ops: APIClient, pembeli: User) -> None:
        """Pembeli yang dihapus tidak bisa dikembalikan, dan riwayat
        pemakaiannya ikut hilang bersama alasan kenapa ia dihapus."""
        respons = klien_ops.post(f"{KLIEN}/{pembeli.id}/aktif", {"aktif": False}, format="json")

        assert respons.status_code == 200
        pembeli.refresh_from_db()
        assert pembeli.is_active is False
        assert User.objects.filter(pk=pembeli.pk).exists()

    def test_pembeli_biasa_tidak_bisa_menaikkan_jatahnya_sendiri(self, pembeli: User) -> None:
        klien = APIClient()
        klien.force_authenticate(user=pembeli)

        respons = klien.post(f"{KLIEN}/{pembeli.id}/bonus", {"jumlah": 50}, format="json")

        assert respons.status_code == 403
        assert BonusKuota.objects.count() == 0
