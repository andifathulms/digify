"""Fitur Tab 6 · Waste Tracker — seluruhnya aturan sendiri, TANPA AI.

Persentase dan nilai rupiahnya memang sudah hitungan sejak awal. Yang pindah
sekarang dugaan penyebab dan rekomendasinya, dan keduanya berasal dari tabel
kategori bahan di apps/optimizer/aturan/bahan.py.

"Paling boros persen" dan "paling boros rupiah" tetap dua temuan terpisah:
daun bawang bisa terbuang 30% tapi cuma Rp 9.000, sementara daging sapi
terbuang 5% senilai Rp 35.000. Yang perlu dibenahi lebih dulu yang kedua.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from apps.optimizer.aturan.bahan import kategori_bahan
from apps.optimizer.features.hitungan import bulatkan_rupiah

MINGGU_PER_BULAN = 4

# Pemborosan tidak mungkin hilang seluruhnya. Separuh dianggap bisa dicegah
# dengan cara simpan dan takar yang lebih baik; sisanya memang melekat pada
# proses masak (kulit, tulang, batang, sisa di wadah).
BAGIAN_BISA_DICEGAH = Decimal("0.5")

# Di atas ini pemborosan dianggap sudah mengganggu, bukan lagi wajar.
AMBANG_WASTE_TINGGI = 10.0


def _angka(nilai: float) -> str:
    return f"{int(round(nilai)):,}".replace(",", ".")


def _hitung_per_bahan(bahan_list: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Persentase dan nilai rupiah terbuang untuk tiap bahan."""
    hasil = []
    for bahan in bahan_list:
        jumlah_beli = Decimal(str(bahan["jumlahBeli"]))
        terbuang = Decimal(str(bahan["jumlahTerbuang"]))
        persentase = (
            float((terbuang / jumlah_beli * 100).quantize(Decimal("0.1"), ROUND_HALF_UP))
            if jumlah_beli > 0
            else 0.0
        )
        hasil.append(
            {
                "nama": bahan["nama"],
                "penyebab_pengguna": (bahan.get("penyebab") or "").strip(),
                "kategori": kategori_bahan(bahan["nama"]),
                "persentase_terbuang": persentase,
                "nilai_rupiah": bulatkan_rupiah(terbuang * Decimal(str(bahan["hargaSatuan"]))),
                "nilai_beli": bulatkan_rupiah(jumlah_beli * Decimal(str(bahan["hargaSatuan"]))),
            }
        )
    return hasil


def _ringkasan(
    dihitung: list[dict[str, Any]],
    total_waste: int,
    total_beli: int,
    periode: str,
    paling_boros_rupiah: str,
) -> str:
    if total_waste <= 0:
        return (
            f"Periode {periode}: tidak ada bahan yang tercatat terbuang. Kalau ini benar, "
            f"pengelolaan bahan Anda sudah rapi — pertahankan caranya."
        )

    persen_total = (total_waste / total_beli * 100) if total_beli else 0
    parah = "cukup mengganggu" if persen_total > AMBANG_WASTE_TINGGI else "masih wajar"

    return (
        f"Periode {periode}: dari Rp {_angka(total_beli)} belanja bahan, sekitar "
        f"Rp {_angka(total_waste)} ({persen_total:.0f}%) terbuang — angka ini {parah} "
        f"untuk ukuran warung. Penyumbang kerugian terbesar adalah {paling_boros_rupiah}, "
        f"jadi itu yang paling layak dibenahi lebih dulu."
    )


def _rekomendasi(dihitung: list[dict[str, Any]], total_waste: int) -> list[str]:
    """Saran per kategori bahan yang benar-benar boros, bukan daftar umum.

    Diurutkan dari kategori yang paling banyak membuang uang, dan hanya untuk
    kategori yang memang muncul di data — supaya user tidak membaca saran soal
    daging padahal dia jualan minuman.
    """
    if total_waste <= 0:
        return []

    rugi_per_kategori: dict[str, int] = {}
    saran_kategori: dict[str, str] = {}
    for bahan in dihitung:
        if bahan["nilai_rupiah"] <= 0:
            continue
        nama = bahan["kategori"].nama
        rugi_per_kategori[nama] = rugi_per_kategori.get(nama, 0) + bahan["nilai_rupiah"]
        saran_kategori[nama] = bahan["kategori"].saran

    saran = [
        saran_kategori[nama]
        for nama, _ in sorted(rugi_per_kategori.items(), key=lambda x: x[1], reverse=True)
    ]

    saran.append(
        "Catat bahan terbuang setiap hari selama seminggu, sekecil apa pun. Yang tidak "
        "pernah dicatat tidak akan pernah kelihatan besarnya."
    )
    return saran


def lacak_waste(data: dict[str, Any]) -> dict[str, Any]:
    dihitung = _hitung_per_bahan(data["bahanList"])
    periode = data["periode"]

    total_waste = sum(b["nilai_rupiah"] for b in dihitung)
    total_beli = sum(b["nilai_beli"] for b in dihitung)

    # Dua temuan yang sengaja dipisah — sering bahan yang berbeda (PRD §5 Tab 6).
    paling_boros_persen = max(dihitung, key=lambda b: b["persentase_terbuang"])["nama"]
    paling_boros_rupiah = max(dihitung, key=lambda b: b["nilai_rupiah"])["nama"]

    breakdown = [
        {
            "nama": b["nama"],
            "persentase_terbuang": b["persentase_terbuang"],
            "nilai_rupiah": b["nilai_rupiah"],
            # Catatan pengguna selalu menang atas tebakan kita: dia yang ada
            # di dapurnya, kita cuma menebak dari nama bahan.
            "dugaan_penyebab": b["penyebab_pengguna"] or b["kategori"].penyebab,
        }
        for b in dihitung
    ]

    penghematan = bulatkan_rupiah(Decimal(total_waste) * BAGIAN_BISA_DICEGAH * MINGGU_PER_BULAN)

    return {
        "ringkasan_periode": _ringkasan(
            dihitung, total_waste, total_beli, periode, paling_boros_rupiah
        ),
        "waste_breakdown": breakdown,
        "total_nilai_waste_rupiah": total_waste,
        "bahan_paling_boros_persen": paling_boros_persen,
        "bahan_paling_boros_rupiah": paling_boros_rupiah,
        "rekomendasi": _rekomendasi(dihitung, total_waste),
        "estimasi_penghematan_bulanan": penghematan,
    }
