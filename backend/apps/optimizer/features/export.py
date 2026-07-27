"""Fitur Tab 5 · Laporan Final — seluruhnya aturan sendiri, TANPA AI.

Seluruh kolom laporan sudah berupa hitungan sejak awal. Yang tersisa cuma
kalimat catatannya, dan kalimat itu isinya juga fakta: harga berubah berapa,
untung per porsi jadi berapa. Tidak ada yang perlu "dikarang".

Laporan ini dicetak dan dibaca ulang berminggu-minggu kemudian. Angka yang
berubah-ubah tiap kali dibuat ulang akan membuat pemiliknya berhenti percaya
pada laporannya sendiri.
"""

from __future__ import annotations

from typing import Any

from apps.optimizer.features.hitungan import bulatkan_rupiah, margin_persen

# Empat minggu, bukan 30/7 hari. Pemilik warung berpikir dalam minggu, dan
# angka yang bisa dihitung ulang di kepala lebih dipercaya.
MINGGU_PER_BULAN = 4

# Di bawah ini margin dianggap tipis dan disebut di catatan.
AMBANG_MARGIN_TIPIS = 40.0


def _angka(nilai: float) -> str:
    """Format ribuan gaya Indonesia, per angka — bukan dengan mengganti semua
    koma di kalimat jadi titik."""
    return f"{int(round(nilai)):,}".replace(",", ".")


def _catatan_baris(item: dict[str, Any], margin: float) -> str:
    lama = item["oldPrice"]
    baru = item["newPrice"]
    untung = baru - item["cogs"]

    # Untung minus ditulis sebagai "rugi", bukan "untung Rp -1.000". Angka
    # bertanda minus mudah terbaca sekilas sebagai untung kecil, padahal
    # artinya justru kebalikannya.
    if untung > 0:
        hasilnya = f"Untung per porsi {'jadi ' if baru != lama else ''}Rp {_angka(untung)}."
    elif untung < 0:
        hasilnya = f"Masih rugi Rp {_angka(abs(untung))} tiap porsi."
    else:
        hasilnya = "Pas balik modal, belum untung sama sekali."

    if baru > lama:
        perubahan = (
            f"Harga naik Rp {_angka(baru - lama)}, dari Rp {_angka(lama)} jadi Rp {_angka(baru)}."
        )
    elif baru < lama:
        perubahan = (
            f"Harga turun Rp {_angka(lama - baru)}, dari Rp {_angka(lama)} jadi Rp {_angka(baru)}."
        )
    else:
        perubahan = "Harga tidak berubah."

    inti = f"{perubahan} {hasilnya}"

    if untung <= 0:
        return inti + " Menu ini perlu ditinjau ulang."
    if margin < AMBANG_MARGIN_TIPIS:
        return inti + f" Untungnya masih tipis ({margin:.0f}%)."
    return inti


def _catatan_penutup(jumlah_diubah: int, kenaikan_bulanan: int, jumlah_menu: int) -> str:
    if jumlah_diubah == 0:
        return (
            "Belum ada harga yang diubah di laporan ini. Isi kolom harga baru untuk "
            "menu yang mau Anda naikkan, lalu susun ulang laporannya."
        )

    if kenaikan_bulanan > 0:
        return (
            f"{jumlah_diubah} dari {jumlah_menu} menu berubah harganya. Kalau harga baru "
            f"ini dipakai mulai minggu depan, perkiraan tambahan untung sekitar "
            f"Rp {_angka(kenaikan_bulanan)} sebulan. Catat penjualan dua minggu ke depan, "
            f"lalu bandingkan dengan laporan ini — kalau jumlah porsinya turun banyak, "
            f"harganya kembalikan sedikit."
        )

    if kenaikan_bulanan < 0:
        return (
            f"Perubahan harga di laporan ini menurunkan untung sekitar "
            f"Rp {_angka(abs(kenaikan_bulanan))} sebulan. Kalau tujuannya menarik lebih "
            f"banyak pembeli, pantau jumlah porsi dua minggu ke depan — kalau tidak naik, "
            f"kembalikan ke harga lama."
        )

    return (
        f"{jumlah_diubah} menu berubah harganya, tapi total untungnya kira-kira tetap. "
        f"Simpan laporan ini sebagai pembanding bulan depan."
    )


def laporan_final(data: dict[str, Any]) -> dict[str, Any]:
    menu_items = data["menuItems"]

    baris_laporan = []
    for item in menu_items:
        margin = item.get("margin") or margin_persen(item["newPrice"], item["cogs"])
        baris_laporan.append(
            {
                "nama_menu": item["name"],
                "biaya_bahan": bulatkan_rupiah(item["cogs"]),
                "harga_lama": bulatkan_rupiah(item["oldPrice"]),
                "harga_baru": bulatkan_rupiah(item["newPrice"]),
                "margin": margin,
                "terjual_per_minggu": bulatkan_rupiah(item["weeklySales"]),
                "catatan": _catatan_baris(item, margin),
            }
        )

    # Biaya bahan tidak berubah saat harga naik, jadi seluruh selisih harga
    # jadi tambahan untung.
    kenaikan_bulanan = bulatkan_rupiah(
        sum(
            (item["newPrice"] - item["oldPrice"]) * item["weeklySales"] * MINGGU_PER_BULAN
            for item in menu_items
        )
    )
    jumlah_diubah = sum(1 for item in menu_items if item["newPrice"] != item["oldPrice"])

    return {
        "nama_restoran": data["restaurantName"],
        "tanggal": data["date"],
        "menu_items": baris_laporan,
        "ringkasan": {
            "total_item": len(menu_items),
            "item_direprice": jumlah_diubah,
            "estimasi_kenaikan_profit_bulanan": kenaikan_bulanan,
            "catatan_penutup": _catatan_penutup(jumlah_diubah, kenaikan_bulanan, len(menu_items)),
        },
    }
