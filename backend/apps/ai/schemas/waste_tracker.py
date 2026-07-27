"""Schema respons POST /api/waste-tracker (Tab 6 · Waste Tracker)."""

from typing import Any

from apps.ai.schemas.bentuk import angka, daftar, daftar_teks, objek, teks

SCHEMA_WASTE_TRACKER: dict[str, Any] = objek(
    {
        "ringkasan_periode": teks(
            "Satu-dua kalimat: seberapa parah pemborosan periode ini dan apa pola utamanya."
        ),
        "waste_breakdown": daftar(
            objek(
                {
                    "nama": teks("Nama bahan."),
                    "persentase_terbuang": angka("Bagian yang terbuang, persen."),
                    "nilai_rupiah": angka("Nilai yang terbuang, rupiah."),
                    "dugaan_penyebab": teks(
                        "Dugaan penyebab pemborosan bahan ini, satu kalimat."
                    ),
                }
            ),
            "Rincian pemborosan per bahan.",
        ),
        "total_nilai_waste_rupiah": angka("Total nilai bahan terbuang, rupiah."),
        "bahan_paling_boros_persen": teks(
            "Nama bahan dengan persentase terbuang terbesar."
        ),
        "bahan_paling_boros_rupiah": teks(
            "Nama bahan dengan nilai rupiah terbuang terbesar. "
            "Sering berbeda dari yang paling boros secara persentase."
        ),
        "rekomendasi": daftar_teks(
            "Langkah konkret mengurangi pemborosan, satu kalimat per langkah."
        ),
        "estimasi_penghematan_bulanan": angka(
            "Perkiraan penghematan sebulan kalau rekomendasi dijalankan, rupiah."
        ),
    }
)
