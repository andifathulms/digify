"""Test kontrak untuk 9 endpoint AI.

Ini jaring pengaman terpenting di backend. Nama field respons DIKUNCI oleh
docs/API_CONTRACT.md; kalau ada yang tergelincir mengubahnya, frontend akan
menampilkan layar kosong tanpa error yang jelas. Test ini gagal lebih dulu.

Gemini di-mock: test tidak boleh butuh kunci API, jaringan, atau uang.
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture
def client() -> APIClient:
    """Klien yang sudah masuk.

    Sejak Fase 4 seluruh endpoint AI wajib login. Test kontrak menguji BENTUK
    respons, bukan penjagaannya — penjagaan diuji terpisah di
    apps/accounts/tests/test_auth.py.
    """
    from apps.accounts.models import User  # noqa: PLC0415 — butuh DB siap

    klien = APIClient()
    klien.force_authenticate(
        user=User.objects.create_user(email="tester@warung.id", password="rahasia-test-123")
    )
    return klien


# --- Bentuk respons yang dijanjikan kontrak --------------------------------
# Dicatat ulang di sini dengan sengaja, bukan diimpor dari kode produksi.
# Kalau diimpor, mengubah kode juga akan mengubah test dan kontraknya tidak
# terjaga sama sekali.

FIELD_KONTRAK: dict[str, set[str]] = {
    "cost-calculator": {
        "item_name",
        "ingredients_breakdown",
        "cogs_per_portion",
        "current_margin_percentage",
        "food_waste_percentage",
    },
    "pricing": {
        "item_name",
        "dine_in_recommended",
        "delivery_recommended",
        "psychological_price",
        "margin_at_recommended",
        "break_even_dine_in",
        "break_even_delivery",
    },
    "ranking": {
        "rankings",
        "total_weekly_profit",
        "items_to_promote",
        "items_to_reprice",
        "items_to_remove",
    },
    "menu-engineering": {"remove", "promote", "reprice", "bundle", "total_estimated_impact"},
    "export": {"nama_restoran", "tanggal", "menu_items", "ringkasan"},
    "waste-tracker": {
        "ringkasan_periode",
        "waste_breakdown",
        "total_nilai_waste_rupiah",
        "bahan_paling_boros_persen",
        "bahan_paling_boros_rupiah",
        "rekomendasi",
        "estimasi_penghematan_bulanan",
    },
    "menu-ideas": {"ringkasan_analisa", "ide_menu", "tips_eksekusi"},
    "marketing-content": {
        "caption_utama",
        "caption_alternatif",
        "hashtag_rekomendasi",
        "ide_visual",
        "call_to_action",
        "waktu_posting_ideal",
    },
    "carousel-content": {
        "ringkasan_konsep",
        "slides",
        "caption_post",
        "hashtag_rekomendasi",
    },
}

# Endpoint yang masih memanggil Gemini, beserta modul fiturnya. Daftar ini
# ditulis tangan dengan sengaja: kalau ada endpoint yang berpindah antara
# "pakai AI" dan "aturan sendiri", perpindahan itu harus terlihat di diff,
# bukan menyelinap tanpa ada yang sadar.
MODUL_AI: dict[str, str] = {
    "menu-ideas": "menu_ideas",
    "marketing-content": "marketing_content",
    "carousel-content": "carousel_content",
}

TARGET_PATCH: dict[str, str] = {
    endpoint: f"apps.optimizer.features.{modul}.call_gemini" for endpoint, modul in MODUL_AI.items()
}

# Endpoint yang seluruhnya hitungan sendiri, dibaca langsung dari view-nya.
ENDPOINT_ATURAN = sorted(set(FIELD_KONTRAK) - set(MODUL_AI))


@contextmanager
def jawaban_gemini(endpoint: str):
    """Palsukan Gemini untuk endpoint AI; diam saja untuk endpoint aturan."""
    if endpoint not in TARGET_PATCH:
        yield None
        return
    with patch(TARGET_PATCH[endpoint], return_value=JAWABAN_PALSU[endpoint]) as mock:
        yield mock


# Payload permintaan yang sah untuk tiap endpoint, memakai contoh nyata yang
# sama dengan prefill di frontend.
PERMINTAAN: dict[str, dict[str, Any]] = {
    "cost-calculator": {
        "itemName": "Nasi Goreng Spesial",
        "ingredientsList": "- Beras 500g @ Rp 8000/kg\n- Telur 2 butir @ Rp 2500",
        "portionWeight": 350,
        "currentPrice": 25000,
    },
    "pricing": {
        "itemName": "Nasi Goreng Spesial",
        "cogs": 8500,
        "targetMargin": 65,
        "platformFeePercent": 27,
        "location": "Semarang",
    },
    "ranking": {
        "menuItems": [
            {"name": "Nasi Goreng Spesial", "cogs": 8500, "price": 25000, "weeklySales": 70},
            {"name": "Es Kopi Susu Gula Aren", "cogs": 6000, "price": 18000, "weeklySales": 120},
        ]
    },
    "menu-engineering": {
        "menuItems": [
            {
                "name": "Nasi Goreng Spesial",
                "cogs": 8500,
                "price": 25000,
                "margin": 66,
                "weeklySales": 70,
                "status": "GREEN",
            }
        ],
        "minItems": 1,
        "peakHours": "11.00–13.00",
    },
    "export": {
        "restaurantName": "Warung Pak Budi",
        "date": "28 Juli 2026",
        "menuItems": [
            {
                "name": "Nasi Goreng Spesial",
                "cogs": 8500,
                "oldPrice": 23000,
                "newPrice": 25000,
                "margin": 66,
                "weeklySales": 70,
            }
        ],
    },
    "waste-tracker": {
        "periode": "Minggu 1 Juli 2026",
        "bahanList": [
            {
                "nama": "Daun bawang",
                "jumlahBeli": 1000,
                "satuan": "gram",
                "hargaSatuan": 30,
                "jumlahTerbuang": 300,
            }
        ],
    },
    "menu-ideas": {
        "existingMenu": [{"name": "Nasi Goreng Spesial", "price": 25000, "margin": 66}],
        "kondisi": "Sore hari sepi pembeli",
        "targetPelanggan": "Pelajar dan pekerja",
        "maxCogs": 10000,
        "jumlahIde": 3,
    },
    "marketing-content": {
        "namaMenu": "Es Kopi Susu Gula Aren",
        "keunggulan": "Gula aren asli, kopi dari petani lokal",
        "platform": "Instagram",
        "gaya": "Santai dan ramah",
    },
    "carousel-content": {
        "namaMenu": "Es Kopi Susu Gula Aren",
        "keunggulan": "Gula aren asli, kopi dari petani lokal",
        "platform": "Instagram",
        "gaya": "Santai dan ramah",
        "jumlahSlide": 4,
    },
}

# Respons Gemini palsu — bentuknya mengikuti schema masing-masing endpoint.
JAWABAN_PALSU: dict[str, dict[str, Any]] = {
    "cost-calculator": {
        "item_name": "Nasi Goreng Spesial",
        "ingredients_breakdown": [
            {"nama": "Beras", "jumlah": 150, "satuan": "gram", "harga_satuan": 8, "biaya": 1200}
        ],
        "cogs_per_portion": 8500,
        "current_margin_percentage": 66.0,
        "food_waste_percentage": 5.0,
    },
    "pricing": {
        "item_name": "Nasi Goreng Spesial",
        "dine_in_recommended": 24500,
        "delivery_recommended": 33500,
        "psychological_price": 23500,
        "margin_at_recommended": 65.3,
        "break_even_dine_in": 0,
        "break_even_delivery": 0,
    },
    "ranking": {
        "rankings": [
            {
                "rank": 1,
                "item": "Es Kopi Susu Gula Aren",
                "weekly_profit": 0,
                "margin_percentage": 0,
                "status": "GREEN",
                "action": "Promosikan di jam sore.",
            },
            {
                "rank": 2,
                "item": "Nasi Goreng Spesial",
                "weekly_profit": 0,
                "margin_percentage": 0,
                "status": "GREEN",
                "action": "Pertahankan.",
            },
        ],
        "total_weekly_profit": 0,
        "items_to_promote": 0,
        "items_to_reprice": 0,
        "items_to_remove": 0,
    },
    "menu-engineering": {
        "remove": [],
        "promote": [
            {
                "item": "Nasi Goreng Spesial",
                "alasan": "Margin sehat dan laris.",
                "aksi": "Pasang di papan depan.",
                "estimasi_dampak": 400000,
            }
        ],
        "reprice": [],
        "bundle": [],
        "total_estimated_impact": 0,
    },
    "export": {
        "nama_restoran": "diabaikan",
        "tanggal": "diabaikan",
        "menu_items": [
            {
                "nama_menu": "Nasi Goreng Spesial",
                "biaya_bahan": 0,
                "harga_lama": 0,
                "harga_baru": 0,
                "margin": 0,
                "terjual_per_minggu": 0,
                "catatan": "Harga naik Rp 2.000.",
            }
        ],
        "ringkasan": {
            "total_item": 0,
            "item_direprice": 0,
            "estimasi_kenaikan_profit_bulanan": 0,
            "catatan_penutup": "Pantau seminggu ke depan.",
        },
    },
    "waste-tracker": {
        "ringkasan_periode": "Pemborosan masih wajar.",
        "waste_breakdown": [
            {
                "nama": "Daun bawang",
                "persentase_terbuang": 0,
                "nilai_rupiah": 0,
                "dugaan_penyebab": "Layu karena disimpan di suhu ruang.",
            }
        ],
        "total_nilai_waste_rupiah": 0,
        "bahan_paling_boros_persen": "diabaikan",
        "bahan_paling_boros_rupiah": "diabaikan",
        "rekomendasi": ["Simpan di wadah tertutup."],
        "estimasi_penghematan_bulanan": 120000,
    },
    "menu-ideas": {
        "ringkasan_analisa": "Belum ada camilan murah.",
        "ide_menu": [
            {
                "nama": "Pisang Goreng Keju",
                "kategori": "Camilan",
                "kesulitan": "Mudah",
                "deskripsi": "Pisang goreng dengan parutan keju.",
                "bahan": ["Pisang", "Keju"],
                "cogs": 4000,
                "harga": 10000,
                "margin": 0,
                "alasan": "Cocok untuk pelajar.",
            }
        ],
        "tips_eksekusi": ["Coba jual 10 porsi dulu."],
    },
    "marketing-content": {
        "caption_utama": "Manisnya pas, kopinya nendang.",
        "caption_alternatif": ["Sore-sore paling enak begini."],
        "hashtag_rekomendasi": ["#kopisusu", "#kulinersemarang"],
        "ide_visual": "Foto gelas dari dekat dengan es yang masih utuh.",
        "call_to_action": "Pesan lewat WhatsApp.",
        "waktu_posting_ideal": "Sore jam 16.00, saat orang mulai ingin ngopi.",
    },
    "carousel-content": {
        "ringkasan_konsep": "Bercerita dari keresahan kopi terlalu manis.",
        "slides": [
            {
                "nomor_slide": 1,
                "tipe_slide": "Hook",
                "teks_slide": "Kopi susu kamu kemanisan?",
                "petunjuk_foto": "Foto gelas dari atas.",
            },
            {
                "nomor_slide": 2,
                "tipe_slide": "Solusi",
                "teks_slide": "Gula aren asli, manisnya pas.",
                "petunjuk_foto": "Foto gula aren.",
            },
            {
                "nomor_slide": 3,
                "tipe_slide": "Bukti",
                "teks_slide": "Kopi dari petani lokal.",
                "petunjuk_foto": "Foto biji kopi.",
            },
            {
                "nomor_slide": 4,
                "tipe_slide": "Penutup",
                "teks_slide": "Pesan sekarang lewat WhatsApp.",
                "petunjuk_foto": "Foto warung.",
            },
        ],
        "caption_post": "Kopi susu gula aren, sekali coba nagih.",
        "hashtag_rekomendasi": ["#kopisusu"],
    },
}


@pytest.mark.parametrize("endpoint", sorted(FIELD_KONTRAK))
def test_respons_memakai_nama_field_dari_kontrak(client: APIClient, endpoint: str) -> None:
    """Nama field respons harus persis seperti docs/API_CONTRACT.md.

    Berlaku untuk KESEMBILAN endpoint, yang memakai AI maupun yang dihitung
    sendiri. Bentuk respons adalah kontraknya; dari mana angkanya berasal
    adalah urusan dalam.
    """
    with jawaban_gemini(endpoint):
        response = client.post(f"/api/{endpoint}", PERMINTAAN[endpoint], format="json")

    assert response.status_code == 200, response.json()
    assert set(response.json().keys()) == FIELD_KONTRAK[endpoint]


@pytest.mark.parametrize("endpoint", sorted(MODUL_AI))
def test_endpoint_ai_memakai_schema_structured_output(client: APIClient, endpoint: str) -> None:
    """Endpoint yang memanggil Gemini wajib mengirim JSON Schema. Tanpa itu,
    bentuk respons cuma harapan, bukan jaminan."""
    with patch(TARGET_PATCH[endpoint], return_value=JAWABAN_PALSU[endpoint]) as mock:
        client.post(f"/api/{endpoint}", PERMINTAAN[endpoint], format="json")

    schema = mock.call_args.kwargs["schema"]
    assert schema["type"] == "OBJECT"
    assert schema["properties"]
    assert mock.call_args.kwargs["endpoint"] == endpoint


def test_daftar_ai_cocok_dengan_view_sebenarnya() -> None:
    """MODUL_AI di test ini harus cocok dengan flag `pakai_ai` di view.

    Tanpa pemeriksaan ini, seseorang bisa mengubah sebuah endpoint jadi
    memakai AI (atau berhenti memakainya) tanpa satu pun test yang berubah —
    dan perbedaan itulah yang menentukan apakah panggilannya berbiaya dan
    memotong kuota pembeli.
    """
    from apps.optimizer import urls  # noqa: PLC0415 — butuh Django siap

    nyata_ai = set()
    nyata_aturan = set()
    for pola in urls.urlpatterns:
        nama = pola.pattern._route  # mis. "pricing"
        kelas = getattr(pola.callback, "cls", None)
        if kelas is None or not hasattr(kelas, "pakai_ai"):
            continue  # health check
        (nyata_ai if kelas.pakai_ai else nyata_aturan).add(nama)

    assert nyata_ai == set(MODUL_AI)
    assert nyata_aturan == set(ENDPOINT_ATURAN)


@pytest.mark.parametrize("endpoint", ENDPOINT_ATURAN)
def test_endpoint_aturan_jalan_tanpa_kunci_ai(client: APIClient, endpoint: str, settings) -> None:  # noqa: ANN001
    """Profit Engine harus tetap berfungsi walau GEMINI_API_KEY kosong.

    Ini jaring pengaman kalau suatu saat ada yang diam-diam menambahkan
    panggilan AI ke salah satu endpoint Tab 1–6: test ini gagal lebih dulu.
    """
    settings.GEMINI_API_KEY = ""

    response = client.post(f"/api/{endpoint}", PERMINTAAN[endpoint], format="json")

    assert response.status_code == 200, response.json()
    assert set(response.json().keys()) == FIELD_KONTRAK[endpoint]


def test_health_check(client: APIClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "digify-laris-api"}


# --- Bentuk objek bersarang yang ikut dikunci kontrak ----------------------


def test_bentuk_baris_ranking(client: APIClient) -> None:
    with jawaban_gemini("ranking"):
        data = client.post("/api/ranking", PERMINTAAN["ranking"], format="json").json()

    for baris in data["rankings"]:
        assert set(baris.keys()) == {
            "rank",
            "item",
            "weekly_profit",
            "margin_percentage",
            "status",
            "action",
        }
        assert baris["status"] in {"GREEN", "YELLOW", "RED"}


def test_bentuk_baris_biaya_menu(client: APIClient) -> None:
    with jawaban_gemini("cost-calculator"):
        data = client.post(
            "/api/cost-calculator", PERMINTAAN["cost-calculator"], format="json"
        ).json()

    for bahan in data["ingredients_breakdown"]:
        assert set(bahan.keys()) == {"nama", "jumlah", "satuan", "harga_satuan", "biaya"}


def test_bentuk_laporan_export(client: APIClient) -> None:
    with jawaban_gemini("export"):
        data = client.post("/api/export", PERMINTAAN["export"], format="json").json()

    assert set(data["ringkasan"].keys()) == {
        "total_item",
        "item_direprice",
        "estimasi_kenaikan_profit_bulanan",
        "catatan_penutup",
    }
    # Laporan 7 kolom (PRD §5 Tab 5).
    for baris in data["menu_items"]:
        assert len(baris.keys()) == 7


def test_bentuk_slide_carousel(client: APIClient) -> None:
    with jawaban_gemini("carousel-content"):
        data = client.post(
            "/api/carousel-content", PERMINTAAN["carousel-content"], format="json"
        ).json()

    assert len(data["slides"]) == 4
    for nomor, slide in enumerate(data["slides"], start=1):
        assert set(slide.keys()) == {
            "nomor_slide",
            "tipe_slide",
            "teks_slide",
            "petunjuk_foto",
        }
        assert slide["nomor_slide"] == nomor
