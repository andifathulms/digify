"""Penegakan kuota harian dan pencatatan pemakaian."""

from __future__ import annotations

import logging

from django.conf import settings
from django.db.models import F
from django.utils import timezone

from apps.accounts.models import User
from apps.ai.errors import KuotaHarianHabis
from apps.ai.gemini import metrik_terakhir
from apps.usage.models import DailyQuota, UsageLog

logger = logging.getLogger(__name__)


def sisa_kuota(user: User) -> int:
    """Berapa panggilan AI yang masih boleh dipakai hari ini."""
    batas = settings.DAILY_AI_QUOTA
    terpakai = (
        DailyQuota.objects.filter(user=user, date=timezone.localdate())
        .values_list("count", flat=True)
        .first()
        or 0
    )
    return max(0, batas - terpakai)


def pastikan_kuota_cukup(user: User) -> None:
    """Melempar KuotaHarianHabis kalau jatah hari ini sudah habis.

    Dipanggil SEBELUM Gemini dihubungi — kalau setelahnya, biayanya sudah
    terlanjur keluar dan penolakannya jadi tidak ada gunanya.
    """
    # Staff tidak dibatasi: Owner perlu bisa mencoba dan mendemokan produknya
    # sendiri tanpa kehabisan jatah.
    if user.is_staff:
        return

    if sisa_kuota(user) <= 0:
        logger.info("Kuota harian habis untuk %s.", user.email)
        raise KuotaHarianHabis()


def catat_pemakaian(user: User, endpoint: str, *, berhasil: bool) -> None:
    """Simpan UsageLog dan naikkan hitungan harian.

    Panggilan yang gagal tetap menaikkan hitungan: satu panggilan gagal tetap
    membebani kuota Gemini, dan tanpa ini klik berulang saat server AI sedang
    bermasalah jadi tidak terbatas sama sekali.
    """
    metrik = metrik_terakhir.get()

    UsageLog.objects.create(
        user=user,
        endpoint=endpoint,
        status=UsageLog.Status.OK if berhasil else UsageLog.Status.ERROR,
        latency_ms=metrik.latency_ms if metrik else 0,
        retry_count=metrik.retry_count if metrik else 0,
    )

    # get_or_create + F(): dua permintaan yang datang bersamaan tetap menaikkan
    # hitungan dua kali, bukan saling menimpa.
    kuota, _ = DailyQuota.objects.get_or_create(user=user, date=timezone.localdate())
    DailyQuota.objects.filter(pk=kuota.pk).update(count=F("count") + 1)
