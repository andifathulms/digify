"""Satu-satunya pintu ke Gemini.

Aturan keras (CLAUDE.md §3.1, §3.5, §6):
- Kunci API hanya hidup di container backend. Tidak pernah ke browser.
- Tidak ada view yang memanggil Gemini langsung. Semua lewat `call_gemini`.
- Structured output wajib: setiap panggilan mengirim JSON Schema, tidak ada
  parsing teks bebas dan tidak ada regex atas keluaran model.
- Retry 3× dengan jeda 2–4 detik, HANYA untuk 503. Endpoint tidak pernah
  membuat retry sendiri.
- Kegagalan teknis diterjemahkan jadi pesan Bahasa Indonesia (apps/ai/errors.py).
  Exception aslinya dicatat ke log, tidak pernah ditampilkan ke user.
"""

from __future__ import annotations

import json
import logging
import time
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Any

from django.conf import settings

from apps.ai.errors import AIBusyError, AIQuotaError, AITimeoutError, AIUnknownError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class MetrikPanggilan:
    """Catatan satu panggilan AI, dibaca apps/usage untuk UsageLog."""

    endpoint: str
    latency_ms: int
    retry_count: int
    status: str  # "ok" | "error"


# Metrik panggilan terakhir di dalam request ini. Dipakai supaya `call_gemini`
# tetap punya tanda tangan sederhana (-> dict) seperti yang ditetapkan CLAUDE.md,
# tanpa menghilangkan data yang dibutuhkan pencatatan pemakaian.
metrik_terakhir: ContextVar[MetrikPanggilan | None] = ContextVar("metrik_terakhir", default=None)


def _kode_status(exc: Exception) -> int | None:
    """Ambil kode HTTP dari exception SDK, apa pun bentuknya."""
    for atribut in ("code", "status_code"):
        nilai = getattr(exc, atribut, None)
        if isinstance(nilai, int):
            return nilai
    respons = getattr(exc, "response", None)
    nilai = getattr(respons, "status_code", None)
    return nilai if isinstance(nilai, int) else None


def _klasifikasi(
    exc: Exception,
) -> type[AIBusyError | AIQuotaError | AITimeoutError | AIUnknownError]:
    """Petakan kegagalan SDK ke salah satu error yang sudah punya pesan Indonesia."""
    kode = _kode_status(exc)
    if kode == 503:
        return AIBusyError
    if kode == 429:
        return AIQuotaError
    if kode == 504:
        return AITimeoutError

    # SDK tidak selalu memberi kode; jatuh ke pemeriksaan teks status gRPC.
    pesan = str(exc).upper()
    if "UNAVAILABLE" in pesan or "OVERLOADED" in pesan:
        return AIBusyError
    if "RESOURCE_EXHAUSTED" in pesan or "QUOTA" in pesan:
        return AIQuotaError
    if "DEADLINE_EXCEEDED" in pesan or "TIMEOUT" in pesan or isinstance(exc, TimeoutError):
        return AITimeoutError
    return AIUnknownError


def _jeda_detik(percobaan_ke: int) -> float:
    """Backoff 2, 3, 4 detik — masih di dalam rentang 2–4 detik yang diminta PRD,
    tapi deterministik supaya bisa dites."""
    return min(2.0 + (percobaan_ke - 1), 4.0)


def _buat_client() -> Any:
    """Bikin client Gemini. Diimpor di dalam fungsi supaya test bisa mem-patch
    `call_gemini` tanpa perlu SDK atau kunci API sama sekali."""
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY kosong — isi di berkas .env")
        raise AIUnknownError()

    from google import genai  # noqa: PLC0415 — sengaja lazy import

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def call_gemini(
    system_instruction: str,
    user_prompt: str,
    schema: dict[str, Any],
    *,
    endpoint: str = "",
) -> dict[str, Any]:
    """Panggil Gemini dengan structured output, kembalikan hasilnya sebagai dict.

    Bentuk hasil dijamin oleh `schema`, bukan oleh parsing.
    Melempar turunan AIServiceError yang pesannya sudah berbahasa Indonesia.
    """
    from google.genai import types  # noqa: PLC0415 — sengaja lazy import

    client = _buat_client()
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=schema,
        temperature=0.7,
    )

    mulai = time.monotonic()
    percobaan_gagal = 0
    kesalahan_terakhir: Exception | None = None
    maks = max(1, settings.GEMINI_MAX_RETRIES)

    for percobaan in range(1, maks + 1):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=user_prompt,
                config=config,
            )
            data = _baca_json(response)
            _catat_metrik(endpoint, mulai, percobaan_gagal, "ok")
            return data
        except Exception as exc:  # noqa: BLE001 — semua kegagalan diterjemahkan
            kesalahan_terakhir = exc
            kelas_error = _klasifikasi(exc)

            # Hanya 503 yang di-retry. 429 atau input salah tidak akan membaik
            # dengan menunggu, dan retry justru memperburuk kuota.
            if kelas_error is not AIBusyError or percobaan == maks:
                _catat_metrik(endpoint, mulai, percobaan_gagal, "error")
                logger.warning(
                    "Panggilan Gemini gagal (endpoint=%s, percobaan=%s/%s)",
                    endpoint,
                    percobaan,
                    maks,
                    exc_info=True,
                )
                raise kelas_error() from exc

            percobaan_gagal += 1
            jeda = _jeda_detik(percobaan)
            logger.info(
                "Gemini sibuk (endpoint=%s), ulangi percobaan %s dalam %.1f detik",
                endpoint,
                percobaan + 1,
                jeda,
            )
            time.sleep(jeda)

    # Tidak seharusnya sampai sini; jaring pengaman supaya tidak pernah None.
    _catat_metrik(endpoint, mulai, percobaan_gagal, "error")
    raise AIUnknownError() from kesalahan_terakhir


def _baca_json(response: Any) -> dict[str, Any]:
    """Ambil objek JSON dari respons. Sudah dijamin schema, jadi kalau di sini
    gagal berarti ada yang tidak beres di sisi model — bukan tugas endpoint."""
    teks = getattr(response, "text", None)
    if not teks:
        logger.error("Respons Gemini kosong: %r", response)
        raise AIUnknownError()
    try:
        data = json.loads(teks)
    except json.JSONDecodeError as exc:
        logger.error("Respons Gemini bukan JSON walau schema dipasang: %r", teks[:500])
        raise AIUnknownError() from exc
    if not isinstance(data, dict):
        logger.error("Respons Gemini bukan objek: %r", teks[:500])
        raise AIUnknownError()
    return data


def _catat_metrik(endpoint: str, mulai: float, retry_count: int, status: str) -> None:
    latency_ms = int((time.monotonic() - mulai) * 1000)
    metrik_terakhir.set(
        MetrikPanggilan(
            endpoint=endpoint,
            latency_ms=latency_ms,
            retry_count=retry_count,
            status=status,
        )
    )
    logger.info("AI %s status=%s durasi=%sms retry=%s", endpoint, status, latency_ms, retry_count)
