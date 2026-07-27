"""Pembantu kecil untuk menulis JSON Schema Gemini.

Gemini memakai subset OpenAPI dengan nama tipe HURUF BESAR ("OBJECT", "STRING").
Menuliskannya berulang-ulang bikin schema susah dibaca, jadi dibungkus di sini.

`required` sengaja selalu diisi seluruh properti: kalau ada field kontrak yang
boleh hilang, respons endpoint jadi tidak konsisten dan frontend harus menebak.
"""

from __future__ import annotations

from typing import Any

STR: dict[str, Any] = {"type": "STRING"}
NUM: dict[str, Any] = {"type": "NUMBER"}
INT: dict[str, Any] = {"type": "INTEGER"}


def teks(deskripsi: str) -> dict[str, Any]:
    return {"type": "STRING", "description": deskripsi}


def angka(deskripsi: str) -> dict[str, Any]:
    return {"type": "NUMBER", "description": deskripsi}


def bulat(deskripsi: str) -> dict[str, Any]:
    return {"type": "INTEGER", "description": deskripsi}


def pilihan(deskripsi: str, nilai: list[str]) -> dict[str, Any]:
    return {"type": "STRING", "description": deskripsi, "enum": nilai}


def objek(properti: dict[str, Any], deskripsi: str = "") -> dict[str, Any]:
    schema: dict[str, Any] = {
        "type": "OBJECT",
        "properties": properti,
        "required": list(properti.keys()),
    }
    if deskripsi:
        schema["description"] = deskripsi
    return schema


def daftar(item: dict[str, Any], deskripsi: str = "") -> dict[str, Any]:
    schema: dict[str, Any] = {"type": "ARRAY", "items": item}
    if deskripsi:
        schema["description"] = deskripsi
    return schema


def daftar_teks(deskripsi: str) -> dict[str, Any]:
    return {"type": "ARRAY", "items": STR, "description": deskripsi}
