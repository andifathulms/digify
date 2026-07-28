"""Test parser bahan dan Tab 1 · Biaya Menu. Tanpa AI, tanpa mock.

Ini bagian paling rawan dari seluruh Profit Engine: daftar bahan ditulis
manusia, dan bentuknya tidak seragam.
"""

from __future__ import annotations

from decimal import Decimal

import pytest
from rest_framework import serializers

from apps.optimizer.aturan.parser_bahan import urai_baris, urai_daftar
from apps.optimizer.aturan.satuan import baca_angka
from apps.optimizer.features.cost_calculator import hitung_biaya_menu


def hitung(daftar: str, nama="Nasi Goreng Spesial", harga=25000, berat=350) -> dict:
    return hitung_biaya_menu(
        {
            "itemName": nama,
            "ingredientsList": daftar,
            "portionWeight": berat,
            "currentPrice": harga,
        }
    )


class TestBacaAngka:
    @pytest.mark.parametrize(
        ("teks", "harap"),
        [
            ("8000", Decimal("8000")),
            ("8.000", Decimal("8000")),
            ("1.250.000", Decimal("1250000")),
            ("2,5", Decimal("2.5")),
            ("1.250,5", Decimal("1250.5")),
            ("500", Decimal("500")),
        ],
    )
    def test_angka_gaya_indonesia(self, teks: str, harap: Decimal) -> None:
        assert baca_angka(teks) == harap

    def test_titik_desimal_bukan_ribuan_kalau_bukan_tiga_angka(self) -> None:
        """ "2.5" yang dimaksud dua setengah tidak boleh terbaca 25."""
        assert baca_angka("2.5") == Decimal("2.5")

    @pytest.mark.parametrize("teks", ["", "   ", "abc"])
    def test_bukan_angka_mengembalikan_none(self, teks: str) -> None:
        assert baca_angka(teks) is None


class TestUraiBaris:
    @pytest.mark.parametrize(
        "baris",
        [
            "- Beras 500g @ Rp 8.000/kg",
            "Beras 500g @ Rp 8.000/kg",
            "* Beras 500 gram @ 8000/kg",
            "1. Beras 500gr @ Rp8.000/kg",
            "• Beras 0,5kg @ Rp 8.000/kg",
        ],
    )
    def test_bentuk_penulisan_yang_berbeda_hasilnya_sama(self, baris: str) -> None:
        """Pemilik warung menulis apa adanya; bentuknya tidak akan seragam."""
        hasil, _ = urai_baris(baris)

        assert hasil is not None
        assert hasil.nama == "Beras"
        assert hasil.jumlah == Decimal(500)
        assert hasil.satuan == "gram"
        assert hasil.biaya == Decimal(4000)

    def test_konversi_kg_ke_gram(self) -> None:
        hasil, _ = urai_baris("Ayam suwir 80g @ Rp 38.000/kg")
        assert hasil.harga_satuan == Decimal("38")
        assert hasil.biaya == Decimal("3040")

    def test_konversi_liter_ke_ml(self) -> None:
        hasil, _ = urai_baris("Kecap manis 30ml @ Rp 25.000/liter")
        assert hasil.biaya == Decimal("750")

    def test_barang_hitungan_boleh_tanpa_per_satuan(self) -> None:
        """ "2 butir @ Rp 2.500" sudah jelas maksudnya per butir."""
        hasil, _ = urai_baris("Telur 2 butir @ Rp 2.500")
        assert hasil.jumlah == Decimal(2)
        assert hasil.biaya == Decimal(5000)

    def test_berat_tanpa_per_satuan_ditolak_karena_ambigu(self) -> None:
        """ "500g @ Rp 8.000" bisa berarti per kilo ATAU per gram. Salah tebak
        membuat biayanya meleset seribu kali lipat."""
        hasil, alasan = urai_baris("Beras 500g @ Rp 8.000")

        assert hasil is None
        assert "per apa" in alasan

    def test_takaran_sendok_vs_harga_per_kilo_diberi_jalan_keluar(self) -> None:
        """Kasus yang sering terjadi: gula ditakar sendok tapi dibeli per kilo.
        Pesannya harus menyebutkan cara membetulkannya, bukan cuma menolak."""
        hasil, alasan = urai_baris("Gula 2 sdm @ Rp 16.000/kg")

        assert hasil is None
        assert "gram" in alasan

    @pytest.mark.parametrize(
        ("baris", "petunjuk"),
        [
            ("minyak secukupnya", "jumlah"),
            ("Garam @ Rp 5.000/kg", "jumlah"),
            ("Beras 500g", "harga"),
            ("500g @ Rp 8.000/kg", "nama"),
        ],
    )
    def test_baris_tak_terbaca_menjelaskan_yang_kurang(self, baris: str, petunjuk: str) -> None:
        hasil, alasan = urai_baris(baris)

        assert hasil is None
        assert petunjuk in alasan

    def test_nama_bahan_dirapikan(self) -> None:
        hasil, _ = urai_baris("-  ayam   suwir  80g  @ Rp 38.000/kg")
        assert hasil.nama == "Ayam suwir"


class TestUraiDaftar:
    def test_baris_kosong_diabaikan(self) -> None:
        hasil = urai_daftar("Beras 500g @ Rp 8.000/kg\n\n\nTelur 2 butir @ Rp 2.500")
        assert len(hasil.bahan) == 2
        assert hasil.gagal == []

    def test_baris_baik_dan_buruk_dipisahkan(self) -> None:
        hasil = urai_daftar("Beras 500g @ Rp 8.000/kg\nminyak secukupnya")
        assert len(hasil.bahan) == 1
        assert len(hasil.gagal) == 1


class TestHitungBiayaMenu:
    CONTOH = (
        "- Beras 500g @ Rp 8.000/kg\n"
        "- Telur 2 butir @ Rp 2.500/butir\n"
        "- Ayam suwir 80g @ Rp 38.000/kg"
    )

    def test_total_adalah_jumlah_seluruh_bahan(self) -> None:
        hasil = hitung(self.CONTOH)
        assert hasil["cogs_per_portion"] == 4000 + 5000 + 3040

    def test_bentuk_baris_sesuai_kontrak(self) -> None:
        hasil = hitung(self.CONTOH)
        for bahan in hasil["ingredients_breakdown"]:
            assert set(bahan) == {
                "nama",
                "jumlah",
                "satuan",
                "harga_satuan",
                "biaya",
                "harga_beli",
                "satuan_beli",
            }

    def test_harga_beli_ditampilkan_seperti_yang_ditulis(self) -> None:
        """Struk harus bisa dicocokkan dengan nota belanja di tangan pemiliknya.

        "Rp 8 per gram" itu benar, tapi tidak pernah dia lihat di pasar — yang
        dia lihat "Rp 8.000 per kilo". Angka yang tidak bisa dia kenali membuat
        seluruh hitungan terasa tidak bisa dipercaya.
        """
        beras = hitung("Beras 500g @ Rp 8.000/kg")["ingredients_breakdown"][0]
        assert beras["harga_beli"] == 8000.0
        assert beras["satuan_beli"] == "kg"
        # Yang dipakai berhitung tetap harga per satuan dasar.
        assert beras["harga_satuan"] == 8.0

        minyak = hitung("Minyak 30ml @ Rp 18.000/liter")["ingredients_breakdown"][0]
        assert minyak["harga_beli"] == 18000.0
        assert minyak["satuan_beli"] == "liter"

    def test_satuan_beli_ikut_satuan_pakai_kalau_harganya_tanpa_garis_miring(self) -> None:
        """"2 butir @ Rp 2.500" — harganya memang per butir."""
        telur = hitung("Telur 2 butir @ Rp 2.500")["ingredients_breakdown"][0]
        assert telur["harga_beli"] == 2500.0
        assert telur["satuan_beli"] == "butir"

    def test_margin_dihitung_dari_harga_jual_sekarang(self) -> None:
        hasil = hitung(self.CONTOH, harga=25000)
        # (25.000 - 12.040) / 25.000
        assert hasil["current_margin_percentage"] == pytest.approx(51.8, abs=0.1)

    def test_harga_satuan_kecil_tidak_dibulatkan_jadi_nol(self) -> None:
        """Harga per gram sering di bawah Rp 1. Membulatkannya ke rupiah penuh
        membuat baris struk terlihat gratis."""
        hasil = hitung("Beras 500g @ Rp 8.000/kg")
        assert hasil["ingredients_breakdown"][0]["harga_satuan"] == 8.0

        murah = hitung("Air 1000ml @ Rp 500/liter")
        assert murah["ingredients_breakdown"][0]["harga_satuan"] > 0

    def test_baris_gagal_membatalkan_seluruh_hitungan(self) -> None:
        """Biaya bahan yang kurang hitung membuat pemiliknya mengira menunya
        untung padahal tidak — kesalahan paling mahal yang bisa dibuat alat
        ini. Lebih baik menolak dan bertanya."""
        with pytest.raises(serializers.ValidationError) as galat:
            hitung("Beras 500g @ Rp 8.000/kg\nminyak secukupnya")

        pesan = str(galat.value)
        assert "minyak secukupnya" in pesan

    def test_daftar_kosong_ditolak_dengan_contoh(self) -> None:
        with pytest.raises(serializers.ValidationError) as galat:
            hitung("   \n  \n")
        assert "Beras 500g" in str(galat.value)

    def test_pesan_gagal_tidak_menyebut_semua_baris(self) -> None:
        """Pesan sepanjang layar tidak akan dibaca siapa pun."""
        with pytest.raises(serializers.ValidationError) as galat:
            hitung("\n".join(f"bahan {i} tanpa apa-apa" for i in range(10)))

        assert "dan 7 baris lainnya" in str(galat.value)


class TestPerkiraanWaste:
    def test_ditimbang_menurut_besar_biaya(self) -> None:
        """Satu ikat daun bawang yang boros tidak boleh menyeret perkiraan
        seluruh menu, kalau isi biayanya sebenarnya didominasi daging."""
        daging_dominan = hitung("Daging sapi 500g @ Rp 140.000/kg\nDaun bawang 5g @ Rp 30.000/kg")[
            "food_waste_percentage"
        ]
        daun_dominan = hitung("Daging sapi 5g @ Rp 140.000/kg\nDaun bawang 500g @ Rp 30.000/kg")[
            "food_waste_percentage"
        ]

        assert daging_dominan < daun_dominan

    def test_bahan_kering_lebih_hemat_daripada_sayur(self) -> None:
        beras = hitung("Beras 500g @ Rp 8.000/kg")["food_waste_percentage"]
        bayam = hitung("Bayam 500g @ Rp 8.000/kg")["food_waste_percentage"]
        assert beras < bayam

    def test_selalu_angka_wajar(self) -> None:
        hasil = hitung("Beras 500g @ Rp 8.000/kg\nDaging sapi 100g @ Rp 140.000/kg")
        assert 0 < hasil["food_waste_percentage"] < 30


def test_hasil_sama_persis_kalau_diulang() -> None:
    daftar = "Beras 500g @ Rp 8.000/kg\nTelur 2 butir @ Rp 2.500"
    assert hitung(daftar) == hitung(daftar)
