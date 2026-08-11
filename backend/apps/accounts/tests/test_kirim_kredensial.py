"""Test pengiriman kredensial.

Kalau test di berkas ini gagal, pembeli membayar lalu tidak pernah bisa masuk.
Itu bukan bug tampilan — itu produk yang tidak sampai ke tangan orang yang
sudah membayarnya (docs/PRODUKSI.md §6.1).
"""

from __future__ import annotations

import json
from unittest.mock import patch

import pytest
from django.core import mail

from apps.accounts.kirim import kirim_kredensial
from apps.accounts.models import License, User
from apps.accounts.webhook import proses_pembayaran

pytestmark = pytest.mark.django_db


@pytest.fixture
def pembeli() -> User:
    return User.objects.create_user(
        email="budi@warung.id", password="rahasia-test-123", full_name="Pak Budi"
    )


class TestIsiEmail:
    def test_memuat_alamat_masuk_email_dan_kata_sandi(self, pembeli: User, settings) -> None:  # noqa: ANN001
        settings.URL_APLIKASI = "https://app.digify.id"

        assert kirim_kredensial(pembeli, "sandi-rahasia") is True

        assert len(mail.outbox) == 1
        pesan = mail.outbox[0]
        assert pesan.to == ["budi@warung.id"]
        assert "sandi-rahasia" in pesan.body
        assert "https://app.digify.id" in pesan.body
        assert "budi@warung.id" in pesan.body

    def test_seluruhnya_bahasa_indonesia(self, pembeli: User) -> None:
        kirim_kredensial(pembeli, "sandi-rahasia")
        pesan = mail.outbox[0]

        for inggris in ["password", "Dear", "Hello", "click here", "Sign in"]:
            assert inggris not in pesan.subject
            assert inggris not in pesan.body

    def test_menyapa_dengan_nama_depan_kalau_ada(self, pembeli: User) -> None:
        kirim_kredensial(pembeli, "x")
        assert "Halo Pak," in mail.outbox[0].body

    def test_tetap_wajar_kalau_namanya_kosong(self) -> None:
        tanpa_nama = User.objects.create_user(email="a@b.id", password="rahasia-test-123")
        kirim_kredensial(tanpa_nama, "x")
        assert "Halo," in mail.outbox[0].body

    def test_menandai_waktu_terkirim(self, pembeli: User) -> None:
        assert pembeli.kredensial_terkirim_at is None
        kirim_kredensial(pembeli, "x")
        pembeli.refresh_from_db()
        assert pembeli.kredensial_terkirim_at is not None


class TestSaatPengirimanGagal:
    def test_tidak_melempar_exception(self, pembeli: User) -> None:
        """Akun yang batal dibuat jauh lebih sulit diperbaiki daripada email
        yang perlu dikirim ulang."""
        with patch("apps.accounts.kirim.send_mail", side_effect=OSError("SMTP mati")):
            assert kirim_kredensial(pembeli, "x") is False

    def test_tidak_menandai_terkirim(self, pembeli: User) -> None:
        with patch("apps.accounts.kirim.send_mail", side_effect=OSError("SMTP mati")):
            kirim_kredensial(pembeli, "x")

        pembeli.refresh_from_db()
        assert pembeli.kredensial_terkirim_at is None

    def test_kata_sandi_tidak_ikut_tercatat_di_log(self, pembeli: User, caplog) -> None:  # noqa: ANN001
        with patch("apps.accounts.kirim.send_mail", side_effect=OSError("SMTP mati")):
            kirim_kredensial(pembeli, "sandi-sangat-rahasia")

        assert "sandi-sangat-rahasia" not in caplog.text


class TestLewatWebhook:
    """Emailnya dikirim lewat `transaction.on_commit`, dan itu memang benar:
    email yang sudah meluncur tidak bisa ditarik kembali kalau transaksinya
    batal. Konsekuensinya di test, callback itu tidak jalan sendiri — test
    dibungkus transaksi yang selalu di-rollback. Fixture bawaan pytest-django
    di bawah yang menjalankannya, sekaligus membuktikan callback-nya memang
    terdaftar."""

    def _kirim_webhook(self, order_id: str = "ORD-1", email: str = "budi@warung.id"):
        return proses_pembayaran(
            external_id=f"EVT-{order_id}",
            order_id=order_id,
            email=email,
            payload={"order_id": order_id, "email": email},
            nama="Pak Budi",
            amount=249000,
        )

    def test_pembayaran_baru_mengirim_kredensial(self, django_capture_on_commit_callbacks) -> None:  # noqa: ANN001
        with django_capture_on_commit_callbacks(execute=True):
            hasil = self._kirim_webhook()

        assert hasil.dibuat_baru is True
        assert len(mail.outbox) == 1
        assert hasil.kata_sandi_awal is not None
        assert hasil.kata_sandi_awal in mail.outbox[0].body

    def test_kiriman_ulang_tidak_mengirim_email_kedua(
        self, django_capture_on_commit_callbacks
    ) -> None:  # noqa: ANN001
        """Idempotensi harus berlaku untuk emailnya juga. Tanpa ini, penyedia
        yang mengirim ulang lima kali membuat pembeli menerima lima kata sandi
        berbeda, dan hanya satu yang benar."""
        with django_capture_on_commit_callbacks(execute=True):
            self._kirim_webhook()
        for _ in range(3):
            with django_capture_on_commit_callbacks(execute=True):
                self._kirim_webhook()

        assert User.objects.count() == 1
        assert License.objects.count() == 1
        assert len(mail.outbox) == 1

    def test_akun_tetap_dibuat_walau_email_gagal(self, django_capture_on_commit_callbacks) -> None:  # noqa: ANN001
        """Pembelinya sudah membayar. Akunnya harus tetap ada."""
        with (
            patch("apps.accounts.kirim.send_mail", side_effect=OSError("SMTP mati")),
            django_capture_on_commit_callbacks(execute=True),
        ):
            hasil = self._kirim_webhook()

        assert hasil.dibuat_baru is True
        assert User.objects.filter(email="budi@warung.id").exists()

        # Dan harus bisa ditemukan lagi: panel mencari yang seperti ini.
        pembeli = User.objects.get(email="budi@warung.id")
        assert pembeli.kredensial_terkirim_at is None

    def test_email_tidak_terkirim_kalau_akunnya_sudah_ada(
        self, django_capture_on_commit_callbacks
    ) -> None:  # noqa: ANN001
        """Pesanan kedua dari orang yang sama tidak boleh mengirim ulang kata
        sandi — kata sandinya sudah diganti sendiri sejak lama."""
        with django_capture_on_commit_callbacks(execute=True):
            self._kirim_webhook(order_id="ORD-1")
        mail.outbox.clear()

        with django_capture_on_commit_callbacks(execute=True):
            self._kirim_webhook(order_id="ORD-2")

        assert len(mail.outbox) == 0


class TestEndpointWebhook:
    def test_pembayaran_sungguhan_dari_ujung_ke_ujung(
        self, client, settings, django_capture_on_commit_callbacks
    ) -> None:  # noqa: ANN001
        """Rantai penuh: tanda tangan → akun → email berisi kata sandi yang
        benar-benar bisa dipakai masuk."""
        import hashlib
        import hmac

        settings.AFFILIATE_ID_WEBHOOK_SECRET = "rahasia-uji"
        isi = json.dumps(
            {"order_id": "ORD-9", "email": "siti@warung.id", "name": "Bu Siti", "amount": 249000}
        ).encode()
        tanda = hmac.new(b"rahasia-uji", isi, hashlib.sha256).hexdigest()

        with django_capture_on_commit_callbacks(execute=True):
            respons = client.post(
                "/api/webhooks/affiliate-id",
                data=isi,
                content_type="application/json",
                HTTP_X_SIGNATURE=tanda,
            )

        assert respons.status_code == 200
        assert len(mail.outbox) == 1

        # Kata sandi di dalam email benar-benar berlaku.
        pembeli = User.objects.get(email="siti@warung.id")
        badan = mail.outbox[0].body
        kata_sandi = respons.json()["kata_sandi_awal"]
        assert kata_sandi in badan
        assert pembeli.check_password(kata_sandi)
        assert pembeli.must_change_password is True


class TestLastLogin:
    """Penjaga untuk kolom yang tidak pernah terisi sampai 12 Agustus 2026.

    `UPDATE_LAST_LOGIN` di setelan SIMPLE_JWT hanya berlaku untuk serializer
    bawaan SimpleJWT. View masuk di sini memakai serializer sendiri, jadi tidak
    ada satu pun jalur yang menulis `last_login` — dan panel memakai kolom itu
    untuk menandai "belum pernah masuk". Akibatnya panel menuduh SETIAP pembeli
    tidak pernah memakai akunnya, termasuk yang baru saja masuk.
    """

    def test_masuk_mencatat_waktu_masuk_terakhir(self, client, pembeli: User) -> None:  # noqa: ANN001
        assert pembeli.last_login is None

        respons = client.post(
            "/api/auth/masuk",
            data=json.dumps({"email": pembeli.email, "kata_sandi": "rahasia-test-123"}),
            content_type="application/json",
        )

        assert respons.status_code == 200
        pembeli.refresh_from_db()
        assert pembeli.last_login is not None

    def test_masuk_yang_gagal_tidak_mencatat_apa_pun(self, client, pembeli: User) -> None:  # noqa: ANN001
        client.post(
            "/api/auth/masuk",
            data=json.dumps({"email": pembeli.email, "kata_sandi": "salah-sekali"}),
            content_type="application/json",
        )

        pembeli.refresh_from_db()
        assert pembeli.last_login is None
