"""Konfigurasi bersama untuk seluruh test backend."""

from __future__ import annotations

import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def cache_bersih(settings) -> None:  # noqa: ANN001 — fixture pytest-django
    """Setiap test mulai dengan hitungan throttle yang kosong.

    Throttle burst DRF menyimpan hitungannya di cache. Tanpa pembersihan ini,
    test ke-11 dalam satu menit akan kena 429 dan gagal karena alasan yang
    sama sekali tidak ada hubungannya dengan yang sedang diuji.

    Cache juga dipindah ke memori proses supaya test tidak butuh Redis hidup.
    """
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    cache.clear()
    yield
    cache.clear()
