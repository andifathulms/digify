"""Test daftar menu tersimpan.

Kriteria selesai Fase 5: daftar menu yang diisi di Tab 3 langsung tersedia di
Tab 4, 5, dan 7 tanpa diketik ulang.
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import MenuItem

pytestmark = pytest.mark.django_db

DAFTAR = [
    {"name": "Nasi Goreng Spesial", "cogs": 8500, "price": 25000, "weekly_sales": 70},
    {"name": "Es Kopi Susu Gula Aren", "cogs": 6000, "price": 18000, "weekly_sales": 120},
]


@pytest.fixture
def user() -> User:
    return User.objects.create_user(email="budi@warung.id", password="rahasia-test-123")


@pytest.fixture
def client(user: User) -> APIClient:
    klien = APIClient()
    klien.force_authenticate(user=user)
    return klien


class TestSimpanDanAmbil:
    def test_menu_yang_disimpan_bisa_diambil_lagi(self, client: APIClient) -> None:
        """Inilah gunanya fitur ini: diisi sekali di Tab 3, dipakai lagi di
        Tab 4, 5, dan 7 tanpa diketik ulang."""
        simpan = client.put("/api/menu", {"menu": DAFTAR}, format="json")
        assert simpan.status_code == 200

        ambil = client.get("/api/menu")
        assert ambil.status_code == 200

        nama = [baris["name"] for baris in ambil.json()["menu"]]
        assert nama == ["Es Kopi Susu Gula Aren", "Nasi Goreng Spesial"]  # urut nama

    def test_menyimpan_ulang_mengganti_isi_lama_bukan_menumpuk(self, client: APIClient) -> None:
        client.put("/api/menu", {"menu": DAFTAR}, format="json")
        client.put("/api/menu", {"menu": DAFTAR[:1]}, format="json")

        assert MenuItem.objects.count() == 1

    def test_daftar_kosong_menghapus_semua(self, client: APIClient) -> None:
        client.put("/api/menu", {"menu": DAFTAR}, format="json")
        assert client.put("/api/menu", {"menu": []}, format="json").status_code == 200
        assert MenuItem.objects.count() == 0

    def test_nama_menu_kembar_ditolak_dengan_menyebut_namanya(self, client: APIClient) -> None:
        respons = client.put(
            "/api/menu",
            {"menu": [DAFTAR[0], DAFTAR[0]]},
            format="json",
        )
        assert respons.status_code == 400
        assert "Nasi Goreng Spesial" in respons.json()["error"]

    def test_angka_disimpan_sebagai_rupiah_bulat(self, client: APIClient) -> None:
        client.put(
            "/api/menu",
            {"menu": [{"name": "Es Teh", "cogs": 1500, "price": 5000, "weekly_sales": 200}]},
            format="json",
        )
        menu = MenuItem.objects.get()
        assert menu.cogs == 1500
        assert menu.price == 5000


class TestPemisahanAntarUser:
    def test_menu_user_lain_tidak_pernah_terlihat(self, client: APIClient) -> None:
        siti = User.objects.create_user(email="siti@warung.id", password="rahasia-test-123")
        MenuItem.objects.create(user=siti, name="Menu Warung Siti", cogs=1, price=2)

        assert client.get("/api/menu").json()["menu"] == []

    def test_menyimpan_tidak_menghapus_menu_user_lain(self, client: APIClient) -> None:
        """Penghapusan sebelum penulisan harus dibatasi pada user yang sedang
        masuk. Kalau tidak, satu orang menyimpan menu bisa mengosongkan daftar
        seluruh pembeli."""
        siti = User.objects.create_user(email="siti@warung.id", password="rahasia-test-123")
        MenuItem.objects.create(user=siti, name="Menu Warung Siti", cogs=1, price=2)

        client.put("/api/menu", {"menu": DAFTAR}, format="json")

        assert MenuItem.objects.filter(user=siti).count() == 1


class TestWajibMasuk:
    def test_tanpa_token_ditolak(self) -> None:
        respons = APIClient().get("/api/menu")
        assert respons.status_code in (401, 403)
        assert respons.json() == {"error": "Sesi Anda sudah berakhir. Silakan masuk lagi."}
