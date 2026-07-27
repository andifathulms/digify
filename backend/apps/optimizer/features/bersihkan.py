"""Pembersih keluaran model.

Schema menjamin bentuk, tapi tidak menjamin isinya rapi: masih bisa ada string
kosong, spasi menggantung, atau elemen null di dalam array. Frontend tidak
boleh menampilkan bullet kosong, jadi dirapikan di sini.
"""

from __future__ import annotations

from typing import Any


def teks(nilai: Any) -> str:
    """Ambil string bersih. None jadi string kosong, bukan tulisan 'None'."""
    if nilai is None:
        return ""
    return str(nilai).strip()


def daftar_teks(nilai: Any) -> list[str]:
    """Ambil daftar string, buang yang kosong dan yang bukan string."""
    if not isinstance(nilai, list):
        return []
    return [teks(baris) for baris in nilai if isinstance(baris, str) and teks(baris)]
