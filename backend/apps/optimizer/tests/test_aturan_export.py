"""Test aturan Tab 5 · Laporan Final. Tanpa AI, tanpa mock."""

from __future__ import annotations

import pytest

from apps.optimizer.features.export import MINGGU_PER_BULAN, laporan_final


def susun(menu: list[dict], nama="Warung Pak Budi", tanggal="28 Juli 2026") -> dict:
    return laporan_final({"restaurantName": nama, "date": tanggal, "menuItems": menu})


def baris(nama="Menu", cogs=8500, oldPrice=23000, newPrice=25000, weeklySales=70):  # noqa: N803
    return {
        "name": nama,
        "cogs": cogs,
        "oldPrice": oldPrice,
        "newPrice": newPrice,
        "margin": 0,
        "weeklySales": weeklySales,
    }


class TestAngkaLaporan:
    def test_laporan_tetap_tujuh_kolom(self) -> None:
        """PRD §5 Tab 5: tabel laporan 7 kolom."""
        hasil = susun([baris()])
        assert len(hasil["menu_items"][0]) == 7

    def test_nama_dan_tanggal_dipakai_apa_adanya(self) -> None:
        hasil = susun([baris()], nama="Kedai Bu Siti", tanggal="1 Agustus 2026")
        assert hasil["nama_restoran"] == "Kedai Bu Siti"
        assert hasil["tanggal"] == "1 Agustus 2026"

    def test_kenaikan_profit_bulanan_dihitung_dari_selisih_harga(self) -> None:
        # (25.000 - 23.000) x 70 porsi x 4 minggu = 560.000
        hasil = susun([baris()])
        assert hasil["ringkasan"]["estimasi_kenaikan_profit_bulanan"] == 2000 * 70 * 4

    def test_empat_minggu_per_bulan(self) -> None:
        """Pemilik warung berpikir dalam minggu; angka yang bisa dihitung ulang
        di kepala lebih dipercaya daripada 30/7 hari."""
        assert MINGGU_PER_BULAN == 4

    def test_penurunan_harga_menghasilkan_angka_minus(self) -> None:
        hasil = susun([baris(oldPrice=25000, newPrice=23000)])
        assert hasil["ringkasan"]["estimasi_kenaikan_profit_bulanan"] < 0

    def test_hanya_menu_yang_harganya_berubah_yang_dihitung_direprice(self) -> None:
        hasil = susun(
            [
                baris("Berubah", oldPrice=23000, newPrice=25000),
                baris("Tetap", oldPrice=5000, newPrice=5000),
            ]
        )
        assert hasil["ringkasan"]["item_direprice"] == 1
        assert hasil["ringkasan"]["total_item"] == 2


class TestCatatanBaris:
    def test_kenaikan_harga_disebut_selisihnya(self) -> None:
        catatan = susun([baris()])["menu_items"][0]["catatan"]
        assert "naik Rp 2.000" in catatan
        assert "Rp 23.000 jadi Rp 25.000" in catatan

    def test_penurunan_harga_disebut_turun(self) -> None:
        catatan = susun([baris(oldPrice=25000, newPrice=23000)])["menu_items"][0]["catatan"]
        assert "turun Rp 2.000" in catatan

    def test_harga_tetap_dikatakan_apa_adanya(self) -> None:
        catatan = susun([baris(oldPrice=5000, newPrice=5000)])["menu_items"][0]["catatan"]
        assert "tidak berubah" in catatan

    def test_menu_rugi_ditulis_rugi_bukan_untung_minus(self) -> None:
        """ "Untung Rp -1.000" mudah terbaca sekilas sebagai untung kecil,
        padahal artinya justru kebalikannya."""
        catatan = susun([baris(cogs=22000, oldPrice=20000, newPrice=21000)])["menu_items"][0][
            "catatan"
        ]

        assert "rugi Rp 1.000" in catatan
        assert "Rp -" not in catatan

    def test_margin_tipis_disebut(self) -> None:
        catatan = susun([baris(cogs=12000, oldPrice=16000, newPrice=15000)])["menu_items"][0][
            "catatan"
        ]
        assert "tipis" in catatan

    def test_margin_sehat_tidak_diberi_peringatan(self) -> None:
        catatan = susun([baris()])["menu_items"][0]["catatan"]
        assert "tipis" not in catatan
        assert "ditinjau" not in catatan

    def test_setiap_baris_selalu_punya_catatan(self) -> None:
        hasil = susun([baris("A"), baris("B", oldPrice=5000, newPrice=5000)])
        for b in hasil["menu_items"]:
            assert b["catatan"].strip() != ""


class TestCatatanPenutup:
    def test_ada_kenaikan_menyebut_angka_dan_langkah_berikutnya(self) -> None:
        penutup = susun([baris()])["ringkasan"]["catatan_penutup"]
        assert "Rp 560.000" in penutup
        assert "dua minggu" in penutup

    def test_tidak_ada_yang_berubah_menyuruh_isi_harga_baru(self) -> None:
        """Keadaan kosong harus memberi tahu langkah berikutnya dalam satu
        kalimat (CLAUDE.md §7)."""
        penutup = susun([baris(oldPrice=5000, newPrice=5000)])["ringkasan"]["catatan_penutup"]
        assert "harga baru" in penutup

    def test_penurunan_profit_dikatakan_terus_terang(self) -> None:
        penutup = susun([baris(oldPrice=25000, newPrice=23000)])["ringkasan"]["catatan_penutup"]
        assert "menurunkan untung" in penutup
        assert "Rp -" not in penutup


class TestNilaiEkstrem:
    def test_satu_menu_saja(self) -> None:
        assert susun([baris()])["ringkasan"]["total_item"] == 1

    @pytest.mark.parametrize("cogs", [0, 1, 999999])
    def test_biaya_ekstrem_tidak_error(self, cogs: float) -> None:
        hasil = susun([baris(cogs=cogs)])
        assert hasil["menu_items"][0]["catatan"]

    def test_hasil_sama_persis_kalau_diulang(self) -> None:
        """Laporan dicetak dan dibaca ulang berminggu-minggu kemudian. Angka
        yang berubah tiap kali dibuat ulang merusak kepercayaan padanya."""
        menu = [baris("A"), baris("B", cogs=12000, oldPrice=16000, newPrice=15000)]
        assert susun(menu) == susun(menu)
