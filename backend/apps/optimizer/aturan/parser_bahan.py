"""Pengurai daftar bahan yang ditulis bebas — inti Tab 1.

Keputusan produk yang dijaga di sini: pemilik warung TIDAK dipaksa mengisi
form terstruktur per bahan (PRD §5 Tab 1). Dia menempel daftar belanjaannya
apa adanya, dan alat ini yang bekerja.

Bentuk yang dimengerti, semuanya boleh bercampur dalam satu daftar:

    - Beras 500g @ Rp 8.000/kg
    Telur 2 butir @ Rp 2.500/butir
    * Ayam suwir 80 gram @ 38000/kg
    1. Kecap manis 30ml @ Rp 25.000/liter

Kalau sebuah baris tidak terbaca, baris itu TIDAK diam-diam dianggap nol.
Biaya bahan yang kurang hitung membuat pemiliknya mengira menunya untung
padahal tidak — kesalahan paling mahal yang bisa dibuat alat ini. Baris yang
gagal dikembalikan sebagai daftar tersendiri supaya bisa ditanyakan ke user.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from decimal import Decimal

from apps.optimizer.aturan.satuan import (
    HITUNGAN,
    POLA_SATUAN,
    baca_angka,
    jenis_satuan,
    ke_satuan_dasar,
    nama_tampilan,
)

# Penanda daftar di awal baris: "-", "*", "•", "1.", "2)"
POLA_BULLET = re.compile(r"^\s*(?:[-*•·]|\d+[.)])\s*")

# "500g", "2 butir", "30 ml" — angka lalu satuan yang dikenal.
POLA_JUMLAH = re.compile(
    rf"(\d+(?:[.,]\d+)?)\s*({POLA_SATUAN})\b",
    re.IGNORECASE,
)

# Bagian harga: angka, boleh didahului "Rp", boleh diikuti "/kg".
POLA_HARGA = re.compile(
    rf"(?:rp\.?\s*)?(\d[\d.,]*)\s*(?:/\s*({POLA_SATUAN})\b)?",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class BahanTerurai:
    nama: str
    jumlah: Decimal
    satuan: str
    harga_satuan: Decimal
    biaya: Decimal


@dataclass(frozen=True)
class HasilUrai:
    bahan: list[BahanTerurai]
    gagal: list[tuple[str, str]]  # (baris asli, alasan)


def _bersihkan_nama(teks: str) -> str:
    nama = re.sub(r"[\s,;:.\-]+$", "", teks.strip())
    nama = re.sub(r"\s{2,}", " ", nama)
    return nama[:1].upper() + nama[1:] if nama else nama


def urai_baris(baris: str) -> tuple[BahanTerurai | None, str]:
    """Uraikan satu baris. Kembalikan (hasil, alasan_gagal)."""
    asli = baris.strip()
    if not asli:
        return None, ""

    teks = POLA_BULLET.sub("", asli)

    # Pisahkan bagian jumlah dan bagian harga di tanda "@".
    if "@" in teks:
        kiri, _, kanan = teks.partition("@")
    else:
        kiri, kanan = teks, ""

    cocok_jumlah = POLA_JUMLAH.search(kiri)
    if not cocok_jumlah:
        return None, "belum ada jumlah dan satuannya"

    jumlah = baca_angka(cocok_jumlah.group(1))
    satuan_pakai = cocok_jumlah.group(2)
    if jumlah is None or jumlah <= 0:
        return None, "jumlahnya belum terbaca"

    nama = _bersihkan_nama(kiri[: cocok_jumlah.start()] + " " + kiri[cocok_jumlah.end() :])
    if not nama:
        return None, "belum ada nama bahannya"

    if not kanan.strip():
        return None, "belum ada harganya"

    cocok_harga = POLA_HARGA.search(kanan)
    if not cocok_harga:
        return None, "harganya belum terbaca"

    harga = baca_angka(cocok_harga.group(1))
    if harga is None:
        return None, "harganya belum terbaca"

    satuan_harga = cocok_harga.group(2)

    jenis_pakai = jenis_satuan(satuan_pakai)

    if satuan_harga is None:
        # Tanpa "/satuan", harga dianggap per satuan yang dipakai. Itu wajar
        # untuk barang hitungan ("2 butir @ Rp 2.500"), tapi berbahaya untuk
        # berat dan volume: "500g @ Rp 8.000" bisa berarti per kilo ATAU per
        # gram, dan salah tebak membuat biayanya meleset seribu kali lipat.
        if jenis_pakai != HITUNGAN:
            return None, "harganya per apa? tulis misalnya @ Rp 8.000/kg"
        harga_per_dasar = harga
        jumlah_dasar = jumlah
    else:
        if jenis_satuan(satuan_harga) != jenis_pakai:
            # Kasus paling sering: bahan ditakar pakai sendok tapi dibeli
            # per kilo. Gram tidak bisa diubah jadi mililiter tanpa tahu massa
            # jenis bahannya, dan menebaknya berarti mengarang angka biaya.
            # Jadi jangan cuma bilang "tidak bisa" — sebutkan jalan keluarnya.
            return None, (
                f"«{satuan_pakai}» takaran isi sedangkan «{satuan_harga}» takaran berat. "
                f"Tulis jumlahnya dalam gram, misalnya: 25g @ Rp 16.000/kg"
            )
        satu_satuan_harga = ke_satuan_dasar(Decimal(1), satuan_harga)
        if not satu_satuan_harga:
            return None, "satuan harganya belum dikenal"

        harga_per_dasar = harga / satu_satuan_harga
        jumlah_dasar = ke_satuan_dasar(jumlah, satuan_pakai) or jumlah

    biaya = harga_per_dasar * jumlah_dasar

    return (
        BahanTerurai(
            nama=nama,
            # Ditampilkan dalam satuan dasar (gram/ml/buah) supaya seluruh
            # baris struk memakai satuan yang sebanding.
            jumlah=jumlah_dasar,
            satuan=nama_tampilan(satuan_pakai),
            harga_satuan=harga_per_dasar,
            biaya=biaya,
        ),
        "",
    )


def urai_daftar(teks: str) -> HasilUrai:
    """Uraikan seluruh daftar bahan. Baris kosong diabaikan."""
    bahan: list[BahanTerurai] = []
    gagal: list[tuple[str, str]] = []

    for baris in teks.splitlines():
        if not baris.strip():
            continue
        hasil, alasan = urai_baris(baris)
        if hasil:
            bahan.append(hasil)
        else:
            gagal.append((baris.strip(), alasan))

    return HasilUrai(bahan=bahan, gagal=gagal)
