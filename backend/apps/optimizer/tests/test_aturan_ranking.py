"""Test aturan Tab 3 · Ranking Profitabilitas. Tanpa AI, tanpa mock."""

from __future__ import annotations

import pytest

from apps.optimizer.features.ranking import (
    AMBANG_MARGIN_RUGI,
    AMBANG_MARGIN_SEHAT,
    KENAIKAN_MAKS,
    _harga_saran,
    ranking_profitabilitas,
)


def urutkan(menu: list[dict]) -> dict:
    return ranking_profitabilitas({"menuItems": menu})


def satu(nama="Menu", cogs=8500, price=25000, weeklySales=70) -> dict:  # noqa: N803
    return {"name": nama, "cogs": cogs, "price": price, "weeklySales": weeklySales}


class TestUrutan:
    def test_diurut_dari_profit_mingguan_terbesar(self) -> None:
        """Bukan dari margin, bukan dari volume. Menu bermargin tipis tapi
        laris bisa lebih berharga daripada yang tebal tapi jarang laku."""
        hasil = urutkan(
            [
                # margin 66% tapi cuma 10 porsi → profit 165.000
                satu("Margin tebal jarang laku", cogs=8500, price=25000, weeklySales=10),
                # margin 30% tapi 300 porsi → profit 450.000
                satu("Margin tipis tapi laris", cogs=3500, price=5000, weeklySales=300),
            ]
        )
        assert [b["item"] for b in hasil["rankings"]] == [
            "Margin tipis tapi laris",
            "Margin tebal jarang laku",
        ]

    def test_peringkat_berurutan_mulai_dari_satu(self) -> None:
        hasil = urutkan([satu(f"Menu {i}", weeklySales=i * 10) for i in range(1, 6)])
        assert [b["rank"] for b in hasil["rankings"]] == [1, 2, 3, 4, 5]

    def test_total_adalah_jumlah_seluruh_baris(self) -> None:
        hasil = urutkan([satu("A", weeklySales=70), satu("B", weeklySales=30)])
        assert hasil["total_weekly_profit"] == sum(b["weekly_profit"] for b in hasil["rankings"])


class TestStatus:
    def test_menu_rugi_selalu_merah(self) -> None:
        hasil = urutkan([satu(cogs=22000, price=20000, weeklySales=10)])
        assert hasil["rankings"][0]["status"] == "RED"

    def test_margin_di_bawah_ambang_rugi_jadi_merah(self) -> None:
        # margin 10%
        hasil = urutkan([satu(cogs=9000, price=10000)])
        assert hasil["rankings"][0]["margin_percentage"] < AMBANG_MARGIN_RUGI
        assert hasil["rankings"][0]["status"] == "RED"

    def test_margin_tipis_jadi_kuning(self) -> None:
        # margin 25%
        hasil = urutkan([satu(cogs=12000, price=16000)])
        assert hasil["rankings"][0]["status"] == "YELLOW"

    def test_margin_sehat_jadi_hijau(self) -> None:
        hasil = urutkan([satu(cogs=8500, price=25000)])
        assert hasil["rankings"][0]["margin_percentage"] >= AMBANG_MARGIN_SEHAT
        assert hasil["rankings"][0]["status"] == "GREEN"

    def test_margin_sehat_tapi_jarang_laku_tetap_hijau(self) -> None:
        """Menu bermargin sehat yang jarang laku BUKAN masalah harga.
        Menyuruh pemiliknya "perbaiki harga" justru saran yang salah — yang
        dia butuhkan promosi."""
        hasil = urutkan(
            [
                satu("Laris", weeklySales=200),
                satu("Jarang laku", cogs=3000, price=15000, weeklySales=2),
            ]
        )
        jarang = next(b for b in hasil["rankings"] if b["item"] == "Jarang laku")

        assert jarang["status"] == "GREEN"
        assert "tawarkan" in jarang["action"].lower()

    def test_hitungan_status_cocok_dengan_isi_daftar(self) -> None:
        hasil = urutkan(
            [
                satu("Sehat", cogs=8500, price=25000),
                satu("Tipis", cogs=12000, price=16000),
                satu("Rugi", cogs=22000, price=20000),
            ]
        )
        assert hasil["items_to_promote"] == 1
        assert hasil["items_to_reprice"] == 1
        assert hasil["items_to_remove"] == 1


class TestAksi:
    def test_setiap_menu_selalu_dapat_aksi(self) -> None:
        """Kartu tanpa aksi melanggar "output berupa keputusan, bukan angka
        mentah" (PRD §3.2)."""
        hasil = urutkan(
            [satu("A"), satu("B", cogs=12000, price=16000), satu("C", cogs=22000, price=20000)]
        )
        for baris in hasil["rankings"]:
            assert baris["action"].strip() != ""

    def test_kenaikan_harga_yang_disarankan_dibatasi_agar_masuk_akal(self) -> None:
        """Menu rugi tidak boleh disuruh naik dari Rp 20.000 ke Rp 55.000.
        Benar secara hitungan, tapi tidak ada pembeli yang mau."""
        hasil = urutkan([satu(cogs=22000, price=20000, weeklySales=10)])
        aksi = hasil["rankings"][0]["action"]

        assert "55.000" not in aksi
        # Batas satu langkah: 20.000 + 20% = 24.000, dibulatkan naik → 24.500
        assert "24.500" in aksi

    def test_menu_rugi_diberi_tahu_berapa_ruginya_per_porsi(self) -> None:
        hasil = urutkan([satu(cogs=22000, price=20000)])
        assert "rugi Rp 2.000" in hasil["rankings"][0]["action"]

    def test_hanya_peringkat_satu_yang_disebut_penyumbang_terbesar(self) -> None:
        """Dua menu yang sama-sama disebut "terbesar" langsung terasa salah."""
        hasil = urutkan(
            [satu("A", weeklySales=200), satu("B", weeklySales=150), satu("C", weeklySales=100)]
        )
        penyebutan = [b for b in hasil["rankings"] if "terbesar" in b["action"]]

        assert len(penyebutan) == 1
        assert penyebutan[0]["rank"] == 1

    def test_koma_dalam_kalimat_tidak_ikut_jadi_titik(self) -> None:
        """Pemisah ribuan Indonesia memakai titik, tapi hanya pada ANGKA.
        Mengganti seluruh koma di kalimat merusak tata bahasanya."""
        hasil = urutkan([satu(cogs=12000, price=16000)])
        aksi = hasil["rankings"][0]["action"]

        assert "Untungnya 25%, masih tipis" in aksi
        assert "%. masih" not in aksi

    def test_angka_besar_pakai_titik_bukan_koma(self) -> None:
        hasil = urutkan([satu(cogs=12000, price=16000, weeklySales=60)])
        aksi = hasil["rankings"][0]["action"]

        assert "," not in aksi.split("Rp ")[1][:10]

    @pytest.mark.parametrize(
        ("cogs", "harga"),
        [(22000, 20000), (50000, 10000), (9000, 9500), (8500, 1000), (100, 50)],
    )
    def test_saran_harga_selalu_di_atas_modal(self, cogs: float, harga: float) -> None:
        """Kalau batas kenaikan menahan saran sampai masih di bawah modal,
        "sarannya" tetap jual rugi — lebih buruk daripada tidak menyarankan
        apa pun. Batas modal harus menang atas batas kenaikan.

        Diuji lewat fungsinya langsung, bukan dengan mengurai kalimat: kalimat
        boleh berubah, aturannya tidak.
        """
        assert _harga_saran(cogs, harga) > cogs

    def test_batas_kenaikan_benar_benar_dipakai(self) -> None:
        harga = 10000
        hasil = urutkan([satu(cogs=9000, price=harga)])
        aksi = hasil["rankings"][0]["action"]
        # 10.000 + 20% = 12.000
        assert "12.000" in aksi
        assert harga * (1 + KENAIKAN_MAKS) == 12000


class TestNilaiEkstrem:
    def test_satu_menu_saja_tidak_error(self) -> None:
        hasil = urutkan([satu()])
        assert len(hasil["rankings"]) == 1
        assert hasil["rankings"][0]["rank"] == 1

    def test_tidak_ada_yang_laku_tetap_dihitung(self) -> None:
        hasil = urutkan([satu(weeklySales=0)])
        assert hasil["rankings"][0]["weekly_profit"] == 0
        assert hasil["rankings"][0]["status"] == "RED"

    def test_harga_nol_tidak_error(self) -> None:
        hasil = urutkan([satu(cogs=0, price=0, weeklySales=0)])
        assert hasil["rankings"][0]["status"] == "RED"

    def test_hasil_sama_persis_kalau_diulang(self) -> None:
        menu = [satu("A"), satu("B", cogs=12000, price=16000)]
        assert urutkan(menu) == urutkan(menu)
