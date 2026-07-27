"""Fitur Tab 6 · Waste Tracker."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from apps.ai.gemini import call_gemini
from apps.ai.schemas.waste_tracker import SCHEMA_WASTE_TRACKER
from apps.optimizer.features.hitungan import bulatkan_rupiah
from apps.optimizer.prompts.waste_tracker import (
    SYSTEM_WASTE_TRACKER,
    prompt_waste_tracker,
)


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
                "satuan": bahan["satuan"],
                "penyebab": bahan.get("penyebab", ""),
                "persentase_terbuang": persentase,
                "nilai_rupiah": bulatkan_rupiah(terbuang * Decimal(str(bahan["hargaSatuan"]))),
            }
        )
    return hasil


def _baris_untuk_prompt(dihitung: list[dict[str, Any]]) -> str:
    baris = []
    for bahan in dihitung:
        catatan = f", catatan pengguna: {bahan['penyebab']}" if bahan["penyebab"] else ""
        baris.append(
            f"- {bahan['nama']}: terbuang {bahan['persentase_terbuang']}% "
            f"senilai Rp {bahan['nilai_rupiah']:,.0f}{catatan}"
        )
    return "\n".join(baris)


def lacak_waste(data: dict[str, Any]) -> dict[str, Any]:
    dihitung = _hitung_per_bahan(data["bahanList"])

    # Dua temuan yang sengaja dipisah: bahan paling boros secara persentase
    # sering BUKAN bahan yang paling banyak membuang uang (PRD §5 Tab 6).
    paling_boros_persen = max(dihitung, key=lambda b: b["persentase_terbuang"])["nama"]
    paling_boros_rupiah = max(dihitung, key=lambda b: b["nilai_rupiah"])["nama"]
    total = sum(bahan["nilai_rupiah"] for bahan in dihitung)

    hasil = call_gemini(
        system_instruction=SYSTEM_WASTE_TRACKER,
        user_prompt=prompt_waste_tracker(
            periode=data["periode"],
            baris_bahan=_baris_untuk_prompt(dihitung),
            total_rupiah=total,
            paling_boros_persen=paling_boros_persen,
            paling_boros_rupiah=paling_boros_rupiah,
        ),
        schema=SCHEMA_WASTE_TRACKER,
        endpoint="waste-tracker",
    )

    dugaan_per_bahan = {
        str(baris.get("nama", "")): str(baris.get("dugaan_penyebab", "")).strip()
        for baris in hasil.get("waste_breakdown", [])
        if isinstance(baris, dict)
    }

    breakdown = [
        {
            "nama": bahan["nama"],
            "persentase_terbuang": bahan["persentase_terbuang"],
            "nilai_rupiah": bahan["nilai_rupiah"],
            "dugaan_penyebab": dugaan_per_bahan.get(bahan["nama"], "") or bahan["penyebab"],
        }
        for bahan in dihitung
    ]

    rekomendasi = [
        str(baris).strip()
        for baris in hasil.get("rekomendasi", [])
        if isinstance(baris, str) and str(baris).strip()
    ]

    return {
        "ringkasan_periode": str(hasil.get("ringkasan_periode", "")).strip(),
        "waste_breakdown": breakdown,
        "total_nilai_waste_rupiah": total,
        "bahan_paling_boros_persen": paling_boros_persen,
        "bahan_paling_boros_rupiah": paling_boros_rupiah,
        "rekomendasi": rekomendasi,
        "estimasi_penghematan_bulanan": bulatkan_rupiah(
            hasil.get("estimasi_penghematan_bulanan") or 0
        ),
    }
