"""Test layanan Gemini terpusat: retry, klasifikasi error, dan metrik.

Tidak ada panggilan jaringan di sini. Yang dipalsukan hanya client SDK-nya;
pembangunan config dan pembacaan respons tetap kode asli, supaya schema kita
benar-benar diuji terhadap SDK.
"""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from apps.ai.errors import (
    PESAN_KUOTA_AI,
    PESAN_SIBUK,
    PESAN_TERLALU_LAMA,
    PESAN_UMUM,
    AIBusyError,
    AIQuotaError,
    AITimeoutError,
    AIUnknownError,
)
from apps.ai.gemini import call_gemini, metrik_terakhir

SCHEMA_UJI: dict[str, Any] = {
    "type": "OBJECT",
    "properties": {"pesan": {"type": "STRING"}},
    "required": ["pesan"],
}

JAWABAN = {"pesan": "halo"}


class GalatSDK(Exception):
    """Meniru exception SDK Gemini yang membawa kode HTTP."""

    def __init__(self, code: int) -> None:
        super().__init__(f"galat buatan dengan kode {code}")
        self.code = code


def _respons_sukses() -> MagicMock:
    respons = MagicMock()
    respons.text = json.dumps(JAWABAN)
    return respons


def _client_dengan(efek: list[Any]) -> MagicMock:
    client = MagicMock()
    client.models.generate_content.side_effect = efek
    return client


def _panggil(efek: list[Any]) -> dict[str, Any]:
    client = _client_dengan(efek)
    # time.sleep dipalsukan supaya test retry tidak benar-benar menunggu 5 detik.
    with (
        patch("apps.ai.gemini._buat_client", return_value=client),
        patch("apps.ai.gemini.time.sleep") as tidur,
    ):
        try:
            return call_gemini("instruksi", "prompt", SCHEMA_UJI, endpoint="uji")
        finally:
            _panggil.jeda = [panggilan.args[0] for panggilan in tidur.call_args_list]  # type: ignore[attr-defined]
            _panggil.jumlah_panggilan = client.models.generate_content.call_count  # type: ignore[attr-defined]


class TestRetry:
    def test_berhasil_langsung_tanpa_retry(self) -> None:
        assert _panggil([_respons_sukses()]) == JAWABAN
        assert metrik_terakhir.get().retry_count == 0
        assert metrik_terakhir.get().status == "ok"

    def test_503_dua_kali_lalu_berhasil(self) -> None:
        """Kriteria selesai Fase 1: 503 dua kali lalu sukses menghasilkan satu
        respons berhasil dengan retry_count == 2."""
        hasil = _panggil([GalatSDK(503), GalatSDK(503), _respons_sukses()])

        assert hasil == JAWABAN
        metrik = metrik_terakhir.get()
        assert metrik.retry_count == 2
        assert metrik.status == "ok"
        assert _panggil.jumlah_panggilan == 3  # type: ignore[attr-defined]

    def test_jeda_retry_ada_di_rentang_2_sampai_4_detik(self) -> None:
        _panggil([GalatSDK(503), GalatSDK(503), _respons_sukses()])
        jeda = _panggil.jeda  # type: ignore[attr-defined]

        assert jeda == [2.0, 3.0]
        assert all(2.0 <= detik <= 4.0 for detik in jeda)

    def test_503_terus_menerus_berakhir_pesan_sibuk(self) -> None:
        with pytest.raises(AIBusyError) as galat:
            _panggil([GalatSDK(503), GalatSDK(503), GalatSDK(503)])

        assert galat.value.pesan == PESAN_SIBUK
        assert galat.value.status_code == 503
        assert _panggil.jumlah_panggilan == 3  # type: ignore[attr-defined]
        assert metrik_terakhir.get().status == "error"

    def test_429_tidak_pernah_di_retry(self) -> None:
        """Kuota tidak membaik dengan menunggu, dan retry justru memperburuknya."""
        with pytest.raises(AIQuotaError):
            _panggil([GalatSDK(429), _respons_sukses()])

        assert _panggil.jumlah_panggilan == 1  # type: ignore[attr-defined]
        assert _panggil.jeda == []  # type: ignore[attr-defined]

    def test_galat_tak_dikenal_tidak_di_retry(self) -> None:
        with pytest.raises(AIUnknownError):
            _panggil([GalatSDK(400), _respons_sukses()])

        assert _panggil.jumlah_panggilan == 1  # type: ignore[attr-defined]


class TestPenerjemahanError:
    """Semua pesan yang sampai ke user harus Bahasa Indonesia, tanpa kode HTTP
    mentah dan tanpa isi exception aslinya."""

    @pytest.mark.parametrize(
        ("kode", "kelas", "pesan"),
        [
            (503, AIBusyError, PESAN_SIBUK),
            (429, AIQuotaError, PESAN_KUOTA_AI),
            (504, AITimeoutError, PESAN_TERLALU_LAMA),
            (400, AIUnknownError, PESAN_UMUM),
            (500, AIUnknownError, PESAN_UMUM),
        ],
    )
    def test_kode_http_dipetakan_ke_pesan_indonesia(
        self, kode: int, kelas: type, pesan: str
    ) -> None:
        with pytest.raises(kelas) as galat:
            _panggil([GalatSDK(kode)] * 3)

        assert galat.value.pesan == pesan
        assert "galat buatan" not in galat.value.pesan

    @pytest.mark.parametrize(
        ("teks_galat", "kelas"),
        [
            ("503 UNAVAILABLE: model overloaded", AIBusyError),
            ("RESOURCE_EXHAUSTED: quota", AIQuotaError),
            ("DEADLINE_EXCEEDED", AITimeoutError),
            ("sesuatu yang tak terduga", AIUnknownError),
        ],
    )
    def test_tanpa_kode_http_jatuh_ke_teks_status(self, teks_galat: str, kelas: type) -> None:
        """SDK tidak selalu memberi kode HTTP; status gRPC tetap harus dikenali."""
        with pytest.raises(kelas):
            _panggil([Exception(teks_galat)] * 3)


class TestPembacaanRespons:
    def test_respons_kosong_jadi_pesan_umum(self) -> None:
        respons = MagicMock()
        respons.text = ""
        with pytest.raises(AIUnknownError):
            _panggil([respons])

    def test_respons_bukan_json_jadi_pesan_umum(self) -> None:
        respons = MagicMock()
        respons.text = "maaf, saya tidak bisa membantu"
        with pytest.raises(AIUnknownError):
            _panggil([respons])

    def test_respons_bukan_objek_jadi_pesan_umum(self) -> None:
        respons = MagicMock()
        respons.text = json.dumps([1, 2, 3])
        with pytest.raises(AIUnknownError):
            _panggil([respons])
