"""Test hitungan murni.

Angka-angka ini dipakai pemilik warung untuk mengambil keputusan uang, jadi
dites langsung tanpa menyentuh AI sama sekali.
"""

from __future__ import annotations

import pytest

from apps.optimizer.features.hitungan import (
    break_even_delivery,
    break_even_dine_in,
    bulatkan_rupiah,
    margin_persen,
    profit_mingguan,
)


class TestBreakEvenDelivery:
    """break_even_delivery = cogs / (1 - komisi). Inti nilai unik Tab 2."""

    def test_komisi_27_persen(self) -> None:
        # 10.000 / 0,73 = 13.698,6 → 13.699
        assert break_even_delivery(10000, 27) == 13699

    def test_tanpa_komisi_sama_dengan_cogs(self) -> None:
        assert break_even_delivery(10000, 0) == 10000

    def test_komisi_lebih_besar_menaikkan_titik_impas(self) -> None:
        assert break_even_delivery(10000, 35) > break_even_delivery(10000, 27)

    @pytest.mark.parametrize("komisi", [100, 120, -5])
    def test_komisi_mustahil_tidak_bikin_pembagian_nol_atau_harga_minus(
        self, komisi: float
    ) -> None:
        """Komisi >= 100% atau minus tidak boleh menghasilkan error, harga minus,
        atau harga tak hingga yang tampil ke user."""
        hasil = break_even_delivery(10000, komisi)
        assert hasil == 10000

    def test_selalu_di_atas_impas_dine_in(self) -> None:
        assert break_even_delivery(8500, 27) > break_even_dine_in(8500)


class TestMarginPersen:
    def test_margin_biasa(self) -> None:
        # (25.000 - 8.500) / 25.000 = 66%
        assert margin_persen(25000, 8500) == 66.0

    def test_harga_nol_tidak_error(self) -> None:
        assert margin_persen(0, 8500) == 0.0

    def test_jual_rugi_menghasilkan_margin_minus(self) -> None:
        assert margin_persen(5000, 8500) < 0


class TestProfitMingguan:
    def test_profit_biasa(self) -> None:
        assert profit_mingguan(25000, 8500, 70) == 1155000

    def test_tidak_laku_berarti_nol(self) -> None:
        assert profit_mingguan(25000, 8500, 0) == 0

    def test_menu_rugi_menyumbang_profit_minus(self) -> None:
        assert profit_mingguan(5000, 8500, 10) == -35000


class TestBulatkanRupiah:
    """Rupiah tidak punya sen di produk ini."""

    @pytest.mark.parametrize(
        ("masuk", "keluar"),
        [(12500.4, 12500), (12500.5, 12501), (0, 0), (-100.6, -101)],
    )
    def test_pembulatan(self, masuk: float, keluar: int) -> None:
        assert bulatkan_rupiah(masuk) == keluar
