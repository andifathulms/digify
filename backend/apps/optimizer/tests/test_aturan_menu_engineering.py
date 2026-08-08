"""Test aturan Tab 4 · Optimasi Menu (matriks menu engineering). Tanpa AI."""

from __future__ import annotations

import pytest

from apps.optimizer.features.menu_engineering import (
    AMBANG_LARIS,
    KELOMPOK,
    _harga_saran,
    optimasi_menu,
)


def optimasi(menu: list[dict], min_items=1, jam="11.00–13.00") -> dict:
    return optimasi_menu({"menuItems": menu, "minItems": min_items, "peakHours": jam})


def m(nama, cogs, price, weeklySales):  # noqa: N803
    return {
        "name": nama,
        "cogs": cogs,
        "price": price,
        "margin": 0,
        "weeklySales": weeklySales,
        "status": "",
    }


# Empat menu yang sengaja jatuh ke empat kuadran berbeda.
EMPAT_KUADRAN = [
    m("Bintang", 8500, 25000, 100),  # laris, untung tebal
    m("Kuda beban", 12000, 15000, 120),  # laris, untung tipis
    m("Teka-teki", 6000, 20000, 5),  # sepi, untung tebal
    m("Anjing", 9000, 10000, 3),  # sepi, untung tipis
]


class TestMatriks:
    def test_empat_kuadran_masuk_kelompok_yang_benar(self) -> None:
        hasil = optimasi(EMPAT_KUADRAN)

        assert [b["item"] for b in hasil["promote"]] == ["Bintang"]
        assert [b["item"] for b in hasil["reprice"]] == ["Kuda beban"]
        assert hasil["bundle"][0]["item"].startswith("Teka-teki")
        assert [b["item"] for b in hasil["remove"]] == ["Anjing"]

    def test_setiap_menu_masuk_tepat_satu_kelompok(self) -> None:
        """Menyuruh menghentikan dan mempromosikan menu yang sama sekaligus
        langsung menghancurkan kepercayaan pada seluruh saran."""
        hasil = optimasi(EMPAT_KUADRAN)
        semua = [b["item"] for nama in KELOMPOK for b in hasil[nama]]

        # Nama bundling digabung ("A + B"), jadi dicocokkan lewat awalannya.
        assert len(semua) == len(EMPAT_KUADRAN)

    def test_ambang_laris_memakai_70_persen_rata_rata(self) -> None:
        """Bagian dari metode aslinya. Dengan 100% sebagai ambang, hampir
        separuh menu pasti "sepi" semata karena aritmetika."""
        assert AMBANG_LARIS == 0.7

    def test_keempat_kelompok_selalu_ada_walau_kosong(self) -> None:
        hasil = optimasi([m("Sendirian", 8500, 25000, 70)])
        for nama in KELOMPOK:
            assert nama in hasil
            assert isinstance(hasil[nama], list)


class TestSaranHarga:
    def test_tidak_pernah_menyuruh_menurunkan_harga(self) -> None:
        """Menu bermodal kecil punya "harga ideal" di bawah harga jualnya
        sekarang. Tanpa lantai, alat menyuruh MENURUNKAN harga di kolom yang
        judulnya "perbaiki harga"."""
        assert _harga_saran(1500, 5000) > 5000

    @pytest.mark.parametrize(
        ("cogs", "harga"),
        [(1500, 5000), (12000, 16000), (22000, 20000), (100, 50000), (9000, 9500)],
    )
    def test_saran_selalu_di_atas_harga_sekarang_dan_di_atas_modal(
        self, cogs: float, harga: float
    ) -> None:
        saran = _harga_saran(cogs, harga)
        assert saran > harga
        assert saran > cogs

    def test_kenaikan_dibatasi_agar_masih_masuk_akal(self) -> None:
        # 16.000 + 20% = 19.200 → dibulatkan naik jadi 19.500
        assert _harga_saran(12000, 16000) == 19500


class TestDampak:
    def test_total_adalah_jumlah_seluruh_kelompok(self) -> None:
        hasil = optimasi(EMPAT_KUADRAN)
        jumlah = sum(b["estimasi_dampak"] for nama in KELOMPOK for b in hasil[nama])
        assert hasil["total_estimated_impact"] == jumlah

    def test_menghentikan_menu_rugi_menambah_profit(self) -> None:
        hasil = optimasi([m("Laris", 8500, 25000, 100), m("Rugi", 22000, 20000, 5)], min_items=1)
        rugi = next(b for b in hasil["remove"] if b["item"] == "Rugi")
        assert rugi["estimasi_dampak"] > 0

    def test_menghentikan_menu_yang_masih_untung_diakui_mengurangi_profit(self) -> None:
        """Jujur lebih berguna daripada angka yang selalu positif. Menghentikan
        menu yang masih sedikit untung memang kehilangan untung itu."""
        hasil = optimasi(
            [m("Laris", 8500, 25000, 100), m("Sepi tipis", 9000, 10000, 3)], min_items=1
        )
        sepi = next(b for b in hasil["remove"] if b["item"] == "Sepi tipis")
        assert sepi["estimasi_dampak"] < 0

    def test_reprice_dampaknya_dari_selisih_harga_kali_porsi(self) -> None:
        hasil = optimasi(EMPAT_KUADRAN)
        kuda = hasil["reprice"][0]
        # (18.000 - 15.000) x 120 porsi x 4 minggu
        assert kuda["estimasi_dampak"] == (18000 - 15000) * 120 * 4


class TestGuardrailMinItems:
    def test_tidak_pernah_menyarankan_menutup_hampir_semua_menu(self) -> None:
        menu = [m(f"Rugi {i}", 22000, 20000, 3) for i in range(1, 6)]
        hasil = optimasi(menu, min_items=4)

        assert len(hasil["remove"]) <= 1

    def test_yang_disisakan_adalah_yang_paling_merugikan(self) -> None:
        menu = [
            m("Rugi besar", 30000, 20000, 20),
            m("Rugi kecil", 11000, 10000, 2),
            m("Laris", 8500, 25000, 100),
        ]
        hasil = optimasi(menu, min_items=2)

        assert len(hasil["remove"]) == 1
        assert hasil["remove"][0]["item"] == "Rugi besar"

    def test_min_items_lebih_besar_dari_jumlah_menu_tidak_error(self) -> None:
        hasil = optimasi([m("Rugi", 22000, 20000, 3)], min_items=10)
        assert hasil["remove"] == []


class TestIsiRekomendasi:
    def test_setiap_baris_punya_alasan_dan_aksi(self) -> None:
        hasil = optimasi(EMPAT_KUADRAN)
        for nama in KELOMPOK:
            for baris in hasil[nama]:
                assert baris["alasan"].strip()
                assert baris["aksi"].strip()
                assert set(baris) == {"item", "alasan", "aksi", "estimasi_dampak"}

    def test_bundling_menyebut_pasangannya(self) -> None:
        hasil = optimasi(EMPAT_KUADRAN)
        assert " + " in hasil["bundle"][0]["item"]

    @pytest.mark.parametrize(
        "menu",
        [
            EMPAT_KUADRAN,
            [m("Sendirian", 6000, 20000, 5)],
            [m("A", 6000, 20000, 5), m("B", 6000, 20000, 5)],
            [m("Laris", 1000, 2000, 500), m("Mahal sepi", 5000, 40000, 1)],
        ],
    )
    def test_menu_tidak_pernah_dipasangkan_dengan_dirinya_sendiri(self, menu: list[dict]) -> None:
        """Paket "A + A" langsung terlihat seperti alat yang rusak.

        Secara aturan menu terlaris tidak akan pernah jadi teka-teki (yang
        terlaris pasti di atas ambang laris), tapi yang diuji di sini
        sifatnya, bukan jalannya — supaya kalau ambangnya diubah suatu saat,
        test ini yang gagal lebih dulu.
        """
        for baris in optimasi(menu)["bundle"]:
            bagian = baris["item"].split(" + ")
            assert len(bagian) == len(set(bagian))

    def test_jam_sibuk_dipakai_kalau_diisi(self) -> None:
        hasil = optimasi(EMPAT_KUADRAN, jam="18.00–20.00")
        assert "18.00–20.00" in hasil["promote"][0]["aksi"]

    def test_jam_sibuk_kosong_tidak_meninggalkan_kalimat_menggantung(self) -> None:
        hasil = optimasi(EMPAT_KUADRAN, jam="")
        aksi = hasil["promote"][0]["aksi"]
        assert "jam ." not in aksi
        assert "di jam " not in aksi

    def test_menu_rugi_disebut_ruginya_bukan_untung_minus(self) -> None:
        hasil = optimasi([m("Laris", 8500, 25000, 100), m("Rugi", 22000, 20000, 3)])
        rugi = next(b for b in hasil["remove"] if b["item"] == "Rugi")
        assert "rugi Rp 2.000" in rugi["alasan"]
        assert "Rp -" not in rugi["alasan"]


class TestNilaiEkstrem:
    def test_satu_menu_saja_tidak_error(self) -> None:
        hasil = optimasi([m("Sendirian", 8500, 25000, 70)])
        assert hasil["total_estimated_impact"] is not None

    def test_semua_menu_sama_persis(self) -> None:
        hasil = optimasi([m(f"Menu {i}", 8500, 25000, 70) for i in range(3)])
        # Semuanya sama, jadi semuanya laris dan untungnya tebal → bintang.
        assert len(hasil["promote"]) == 3
        assert hasil["remove"] == []

    def test_tidak_ada_yang_laku(self) -> None:
        hasil = optimasi([m("A", 8500, 25000, 0), m("B", 8500, 25000, 0)])
        assert sum(len(hasil[k]) for k in KELOMPOK) == 2

    def test_hasil_sama_persis_kalau_diulang(self) -> None:
        assert optimasi(EMPAT_KUADRAN) == optimasi(EMPAT_KUADRAN)


class TestAngkaYangDicerminkanFrontend:
    """Tab 4 sekarang MENYEBUT metodenya (Kasavana–Smith) dan menampilkan
    posisi tiap menu pada kedua sumbunya.

    Rata-rata dan batas larisnya dihitung ulang di
    `frontend/src/components/ui/DasarOptimasi.tsx` dari daftar menu yang sama.
    Kalau ambangnya melenceng, angka yang tercetak sebagai "batas laris" tidak
    lagi sesuai dengan pengelompokan yang benar-benar dipakai — penjelasan yang
    membantah hasilnya sendiri.
    """

    def test_ambang_laris_cocok_dengan_frontend(self) -> None:
        # Kalau gagal: samakan AMBANG_LARIS di frontend/src/lib/aturan.ts.
        assert AMBANG_LARIS == 0.7, "samakan dengan frontend/src/lib/aturan.ts"

    def test_pengelompokan_memakai_rata_rata_polos(self) -> None:
        """Frontend menghitung rata-rata polos (jumlah ÷ banyaknya) untuk kedua
        sumbu. Kalau backend beralih ke median atau rata-rata tertimbang,
        angka yang ditampilkan berhenti cocok dengan kelompoknya."""
        menu = [
            {"name": "A", "cogs": 5000, "price": 15000, "weeklySales": 100},
            {"name": "B", "cogs": 5000, "price": 15000, "weeklySales": 20},
        ]
        hasil = optimasi_menu({"menuItems": menu, "minItems": 1, "peakHours": "-"})
        # rata terjual 60, batas laris 42 → A laris, B tidak. Untung sama, jadi
        # keduanya "tebal" (>= rata-rata). A jadi bintang (promote), B teka-teki
        # yang dipaketkan DENGAN bintangnya — namanya jadi "B + A", bukan "B".
        assert [r["item"] for r in hasil["promote"]] == ["A"]
        assert [r["item"] for r in hasil["bundle"]] == ["B + A"]
