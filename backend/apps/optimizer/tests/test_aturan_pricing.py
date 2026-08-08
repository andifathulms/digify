"""Test aturan Tab 2 · Harga Jual.

Tidak ada mock di sini karena tidak ada yang perlu di-mock: seluruh Tab 2
hitungan sendiri. Kalau test ini lulus, endpointnya jalan walau GEMINI_API_KEY
kosong sama sekali.
"""

from __future__ import annotations

from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.optimizer.features.hitungan import margin_persen
from apps.optimizer.features.pricing import (
    BOBOT_KOMPETITOR,
    KELIPATAN_HARGA,
    tentukan_harga,
)

pytestmark = pytest.mark.django_db


def hitung(**ubah):
    dasar = {
        "itemName": "Nasi Goreng Spesial",
        "cogs": 8500,
        "targetMargin": 65,
        "competitorPrice": None,
        "platformFeePercent": 27,
        "location": "Semarang",
    }
    return tentukan_harga({**dasar, **ubah})


class TestHargaDasar:
    def test_harga_dine_in_mencapai_target_margin(self) -> None:
        # 8.500 / (1 - 0,65) = 24.285,7 → dibulatkan naik ke 24.500
        hasil = hitung()
        assert hasil["dine_in_recommended"] == 24500
        assert hasil["margin_at_recommended"] >= 65

    @pytest.mark.parametrize("target", [40, 50, 60, 65, 70, 80])
    def test_margin_nyata_tidak_pernah_di_bawah_target(self, target: float) -> None:
        """Pembulatan harga harus selalu NAIK. Kalau turun, margin yang
        dijanjikan ke pemilik warung tidak tercapai."""
        hasil = hitung(targetMargin=target)
        assert hasil["margin_at_recommended"] >= target

    def test_harga_selalu_kelipatan_500(self) -> None:
        for cogs in (7333, 8500, 12111, 999):
            hasil = hitung(cogs=cogs)
            assert hasil["dine_in_recommended"] % 500 == 0
            assert hasil["delivery_recommended"] % 500 == 0


class TestHargaDelivery:
    def test_harga_ojol_selalu_lebih_tinggi_dari_dine_in(self) -> None:
        hasil = hitung()
        assert hasil["delivery_recommended"] > hasil["dine_in_recommended"]

    def test_setelah_dipotong_komisi_untungnya_setara_dine_in(self) -> None:
        """Inti nilai unik produk: jual di ojol dengan harga dine-in berarti
        komisi memakan margin diam-diam."""
        hasil = hitung(platformFeePercent=27)
        diterima = hasil["delivery_recommended"] * (1 - 0.27)
        assert diterima >= hasil["dine_in_recommended"]

    def test_komisi_lebih_besar_menaikkan_harga_ojol(self) -> None:
        assert (
            hitung(platformFeePercent=35)["delivery_recommended"]
            > hitung(platformFeePercent=20)["delivery_recommended"]
        )

    def test_tanpa_komisi_harga_ojol_sama_dengan_dine_in(self) -> None:
        hasil = hitung(platformFeePercent=0)
        assert hasil["delivery_recommended"] == hasil["dine_in_recommended"]


class TestKompetitor:
    def test_kompetitor_lebih_mahal_menaikkan_harga_sebagian(self) -> None:
        """Naik separuh jalan, bukan menyamai. Menyamai persis berarti
        bertaruh warung sebelah sudah menghitung dengan benar."""
        tanpa = hitung()["dine_in_recommended"]
        dengan = hitung(competitorPrice=30000)["dine_in_recommended"]

        assert tanpa < dengan < 30000

    def test_kompetitor_lebih_murah_TIDAK_menurunkan_harga(self) -> None:
        """Kalau warung sebelah menjual di bawah biaya kita, mengikutinya
        berarti ikut rugi — justru masalah yang produk ini mau selesaikan."""
        assert (
            hitung(competitorPrice=9000)["dine_in_recommended"] == hitung()["dine_in_recommended"]
        )

    def test_kompetitor_di_bawah_biaya_bahan_tetap_diabaikan(self) -> None:
        hasil = hitung(competitorPrice=5000)
        assert hasil["dine_in_recommended"] > hasil["break_even_dine_in"]


class TestHargaPsikologis:
    def test_harga_bulat_ribuan_diturunkan_500(self) -> None:
        # cogs 7.000 target 65% → 20.000 tepat → psikologis 19.500
        hasil = hitung(cogs=7000, targetMargin=65)
        assert hasil["dine_in_recommended"] == 20000
        assert hasil["psychological_price"] == 19500

    def test_harga_berakhiran_500_dibiarkan(self) -> None:
        hasil = hitung()
        assert hasil["dine_in_recommended"] == 24500
        assert hasil["psychological_price"] == 24500

    def test_tidak_pernah_turun_di_bawah_titik_impas(self) -> None:
        """Margin 0% membuat harga = biaya bahan. Menurunkannya 500 lagi
        berarti menyarankan jual rugi."""
        hasil = hitung(cogs=10000, targetMargin=0)
        assert hasil["psychological_price"] >= hasil["break_even_dine_in"]


class TestNilaiEkstrem:
    def test_biaya_bahan_nol_tidak_error(self) -> None:
        hasil = hitung(cogs=0)
        assert hasil["dine_in_recommended"] >= 0
        assert hasil["break_even_dine_in"] == 0

    def test_target_margin_99_tidak_bikin_tak_hingga(self) -> None:
        hasil = hitung(targetMargin=99)
        assert hasil["dine_in_recommended"] < 100_000_000

    def test_konsisten_kalau_dihitung_ulang(self) -> None:
        """Hasil harus sama persis tiap kali — inilah yang tidak bisa dijamin
        model bahasa."""
        assert [hitung() for _ in range(5)].count(hitung()) == 5


class TestEndpointTanpaKunciAI:
    def test_endpoint_jalan_walau_gemini_api_key_kosong(self, settings) -> None:  # noqa: ANN001
        settings.GEMINI_API_KEY = ""

        klien = APIClient()
        klien.force_authenticate(
            user=User.objects.create_user(email="budi@warung.id", password="rahasia-test-123")
        )
        respons = klien.post(
            "/api/pricing",
            {"itemName": "Nasi Goreng Spesial", "cogs": 8500},
            format="json",
        )

        assert respons.status_code == 200
        assert respons.json()["dine_in_recommended"] == 24500

    def test_tidak_memotong_kuota_harian(self, settings) -> None:  # noqa: ANN001
        """Kuota harian ada untuk menahan biaya AI. Tab 2 tidak berbiaya, jadi
        memotong jatahnya sama saja menghukum user tanpa alasan."""
        from apps.usage.models import DailyQuota, UsageLog

        settings.DAILY_AI_QUOTA = 1
        klien = APIClient()
        user = User.objects.create_user(email="budi@warung.id", password="rahasia-test-123")
        klien.force_authenticate(user=user)

        for _ in range(3):
            respons = klien.post(
                "/api/pricing", {"itemName": "Nasi Goreng", "cogs": 8500}, format="json"
            )
            assert respons.status_code == 200

        assert DailyQuota.objects.filter(user=user).count() == 0
        assert UsageLog.objects.filter(user=user).count() == 0

    def test_margin_di_harga_rekomendasi_cocok_dengan_hitungan_terpisah(self) -> None:
        """Angka margin yang ditampilkan harus benar-benar berasal dari harga
        dan biaya yang sama — bukan angka lain yang kebetulan mirip."""
        hasil = hitung()
        assert hasil["margin_at_recommended"] == margin_persen(hasil["dine_in_recommended"], 8500)


class TestAngkaYangDicerminkanFrontend:
    """Tab 2 sekarang MENERANGKAN dari mana harga yang disarankan berasal, dan
    penjelasan itu disusun ulang di frontend dari masukan yang sama.

    `frontend/src/lib/aturan.ts` menggandakan BOBOT_KOMPETITOR dan
    KELIPATAN_HARGA untuk keperluan itu. Kalau angkanya melenceng, tangga
    penjelasnya berhenti mendarat di angka backend dan komponennya memilih
    diam — jadi yang hilang penjelasannya, bukan kebenaran angkanya. Test ini
    supaya kehilangan itu ketahuan di sini, bukan dari laporan pengguna yang
    bingung kenapa penjelasannya menghilang.
    """

    def test_bobot_kompetitor_cocok_dengan_frontend(self) -> None:
        # Kalau gagal: samakan BOBOT_KOMPETITOR di frontend/src/lib/aturan.ts.
        assert Decimal("0.5") == BOBOT_KOMPETITOR, "samakan dengan frontend/src/lib/aturan.ts"

    def test_kelipatan_harga_cocok_dengan_frontend(self) -> None:
        # Kalau gagal: samakan KELIPATAN_HARGA di frontend/src/lib/aturan.ts.
        assert KELIPATAN_HARGA == 500, "samakan dengan frontend/src/lib/aturan.ts"  # noqa: SIM300

    def test_kompetitor_hanya_menaikkan(self) -> None:
        """Penjelasannya menyatakan harga kompetitor tidak pernah menurunkan.
        Kalau itu berubah, kalimatnya jadi bohong."""
        tanpa = hitung(competitorPrice=None)["dine_in_recommended"]
        lebih_murah = hitung(competitorPrice=5000)["dine_in_recommended"]
        assert lebih_murah == tanpa
