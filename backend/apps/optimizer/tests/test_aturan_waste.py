"""Test aturan Tab 6 · Waste Tracker dan tabel kategori bahan. Tanpa AI."""

from __future__ import annotations

import pytest

from apps.optimizer.aturan.bahan import KATEGORI, KATEGORI_LAIN, kategori_bahan
from apps.optimizer.features.waste_tracker import lacak_waste


def lacak(bahan: list[dict], periode="Minggu ini") -> dict:
    return lacak_waste({"periode": periode, "bahanList": bahan})


def item(nama="Daun bawang", beli=1000, harga=30, buang=300, penyebab=""):
    return {
        "nama": nama,
        "jumlahBeli": beli,
        "satuan": "gram",
        "hargaSatuan": harga,
        "jumlahTerbuang": buang,
        "penyebab": penyebab,
    }


class TestKategoriBahan:
    @pytest.mark.parametrize(
        ("nama", "kategori"),
        [
            ("Daun bawang", "Sayur dan daun segar"),
            ("Bayam", "Sayur dan daun segar"),
            ("Tomat", "Sayur dan daun segar"),
            ("Cabai rawit", "Cabai dan bumbu segar"),
            ("Bawang merah", "Cabai dan bumbu segar"),
            ("Daging sapi", "Daging, ayam, dan ikan"),
            ("Ayam potong", "Daging, ayam, dan ikan"),
            # "Telur ayam" harus jatuh ke telur, bukan ke daging — kata kunci
            # "telur" lebih panjang daripada "ayam", dan memang itu yang benar.
            ("Telur ayam", "Telur dan produk susu"),
            ("Susu UHT", "Telur dan produk susu"),
            ("Minyak goreng", "Minyak dan bahan cair"),
            ("Kecap manis", "Minyak dan bahan cair"),
            ("Beras", "Bahan kering dan bumbu bubuk"),
            ("Tepung terigu", "Bahan kering dan bumbu bubuk"),
        ],
    )
    def test_bahan_umum_warung_dikenali(self, nama: str, kategori: str) -> None:
        assert kategori_bahan(nama).nama == kategori

    def test_kata_kunci_terpanjang_yang_menang(self) -> None:
        """ "Daun bawang" harus jatuh ke sayur, bukan ke bumbu hanya karena
        namanya mengandung kata "bawang"."""
        assert kategori_bahan("Daun bawang").nama == "Sayur dan daun segar"
        assert kategori_bahan("Bawang merah").nama == "Cabai dan bumbu segar"

    def test_huruf_besar_kecil_tidak_berpengaruh(self) -> None:
        assert kategori_bahan("DAGING SAPI") == kategori_bahan("daging sapi")

    @pytest.mark.parametrize("nama", ["Entah apa", "", "   ", "xyz123"])
    def test_bahan_tak_dikenal_jatuh_ke_kategori_lain(self, nama: str) -> None:
        assert kategori_bahan(nama) == KATEGORI_LAIN

    def test_setiap_kategori_punya_penyebab_dan_saran(self) -> None:
        for kategori in (*KATEGORI, KATEGORI_LAIN):
            assert kategori.penyebab.strip()
            assert kategori.saran.strip()
            assert kategori.waste_persen > 0


class TestHitungan:
    def test_persentase_dan_rupiah_terbuang(self) -> None:
        hasil = lacak([item(beli=1000, harga=30, buang=300)])
        baris = hasil["waste_breakdown"][0]

        assert baris["persentase_terbuang"] == 30.0
        assert baris["nilai_rupiah"] == 9000

    def test_total_adalah_jumlah_seluruh_bahan(self) -> None:
        hasil = lacak([item("Daun bawang"), item("Daging sapi", 5000, 140, 250)])
        assert hasil["total_nilai_waste_rupiah"] == 9000 + 35000

    def test_paling_boros_persen_dan_rupiah_bisa_bahan_berbeda(self) -> None:
        """Inti gunanya alat ini. Daun bawang terbuang 30% tapi cuma Rp 9.000;
        daging sapi 5% tapi Rp 35.000 — yang kedua yang lebih mendesak."""
        hasil = lacak([item("Daun bawang", 1000, 30, 300), item("Daging sapi", 5000, 140, 250)])

        assert hasil["bahan_paling_boros_persen"] == "Daun bawang"
        assert hasil["bahan_paling_boros_rupiah"] == "Daging sapi"

    def test_penghematan_hanya_sebagian_dari_total(self) -> None:
        """Pemborosan tidak mungkin hilang seluruhnya — kulit, tulang, dan
        sisa di wadah memang melekat pada proses masak."""
        hasil = lacak([item()])
        assert 0 < hasil["estimasi_penghematan_bulanan"] < hasil["total_nilai_waste_rupiah"] * 4

    def test_jumlah_beli_nol_tidak_bikin_pembagian_nol(self) -> None:
        hasil = lacak([item(beli=0, buang=0)])
        assert hasil["waste_breakdown"][0]["persentase_terbuang"] == 0.0


class TestPenyebab:
    def test_catatan_pengguna_menang_atas_tebakan_kita(self) -> None:
        """Dia yang ada di dapurnya; kita cuma menebak dari nama bahan."""
        hasil = lacak([item("Beras", penyebab="Tumpah waktu menakar")])
        assert hasil["waste_breakdown"][0]["dugaan_penyebab"] == "Tumpah waktu menakar"

    def test_tanpa_catatan_pengguna_dipakai_tebakan_kategori(self) -> None:
        hasil = lacak([item("Daun bawang", penyebab="")])
        assert "layu" in hasil["waste_breakdown"][0]["dugaan_penyebab"].lower()

    def test_setiap_bahan_selalu_punya_dugaan_penyebab(self) -> None:
        hasil = lacak([item("Entah apa"), item("Daging sapi"), item("Beras")])
        for baris in hasil["waste_breakdown"]:
            assert baris["dugaan_penyebab"].strip() != ""


class TestRekomendasi:
    def test_diurut_dari_kategori_yang_paling_banyak_membuang_uang(self) -> None:
        hasil = lacak(
            [
                item("Daun bawang", 1000, 30, 300),  # Rp 9.000
                item("Daging sapi", 5000, 140, 250),  # Rp 35.000
            ]
        )
        assert "daging" in hasil["rekomendasi"][0].lower()

    def test_hanya_kategori_yang_muncul_di_data_yang_disarankan(self) -> None:
        """User yang jualan minuman tidak perlu membaca saran soal daging."""
        hasil = lacak([item("Kopi bubuk", 1000, 100, 50)])
        gabungan = " ".join(hasil["rekomendasi"]).lower()

        assert "daging" not in gabungan
        assert "sayur" not in gabungan

    def test_selalu_ada_saran_mencatat(self) -> None:
        hasil = lacak([item()])
        assert any("catat" in r.lower() for r in hasil["rekomendasi"])

    def test_tanpa_pemborosan_tidak_memaksa_memberi_saran(self) -> None:
        hasil = lacak([item(buang=0)])
        assert hasil["rekomendasi"] == []
        assert hasil["estimasi_penghematan_bulanan"] == 0


class TestRingkasan:
    def test_menyebut_total_belanja_dan_total_terbuang(self) -> None:
        hasil = lacak([item(beli=1000, harga=30, buang=300)])
        ringkasan = hasil["ringkasan_periode"]

        assert "Rp 30.000" in ringkasan  # total belanja
        assert "Rp 9.000" in ringkasan  # total terbuang

    def test_pemborosan_besar_disebut_mengganggu(self) -> None:
        hasil = lacak([item(beli=1000, harga=30, buang=300)])  # 30%
        assert "mengganggu" in hasil["ringkasan_periode"]

    def test_pemborosan_kecil_disebut_wajar(self) -> None:
        hasil = lacak([item(beli=1000, harga=30, buang=20)])  # 2%
        assert "wajar" in hasil["ringkasan_periode"]

    def test_tanpa_pemborosan_diberi_kalimat_sendiri(self) -> None:
        hasil = lacak([item(buang=0)])
        assert "tidak ada bahan yang tercatat terbuang" in hasil["ringkasan_periode"]

    def test_periode_dipakai_apa_adanya(self) -> None:
        hasil = lacak([item()], periode="Bulan Juli 2026")
        assert "Bulan Juli 2026" in hasil["ringkasan_periode"]


def test_hasil_sama_persis_kalau_diulang() -> None:
    bahan = [item("Daun bawang"), item("Daging sapi", 5000, 140, 250)]
    assert lacak(bahan) == lacak(bahan)
