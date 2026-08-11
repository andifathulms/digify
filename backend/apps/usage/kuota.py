"""Penegakan kuota harian dan pencatatan pemakaian."""

from __future__ import annotations

import logging
from datetime import datetime, time

from django.conf import settings
from django.db.models import F, Sum
from django.utils import timezone

from apps.accounts.models import User
from apps.ai.errors import (
    PESAN_KUOTA_ENDPOINT,
    PESAN_PER_ENDPOINT,
    KuotaBulananHabis,
    KuotaEndpointHabis,
    KuotaHarianHabis,
)
from apps.ai.gemini import metrik_terakhir
from apps.usage.models import DailyQuota, UsageLog

logger = logging.getLogger(__name__)


def sisa_kuota_harian(user: User) -> int:
    """Berapa panggilan AI yang masih boleh dipakai hari ini."""
    terpakai = (
        DailyQuota.objects.filter(user=user, date=timezone.localdate())
        .values_list("count", flat=True)
        .first()
        or 0
    )
    return max(0, settings.DAILY_AI_QUOTA - terpakai)


def sisa_kuota_bulanan(user: User) -> int:
    """Sisa jatah bulan berjalan.

    Dijumlahkan dari DailyQuota, bukan dari tabel hitungan tersendiri: satu
    bulan paling banyak 31 baris per user, jadi menjumlahkannya murah —
    sementara tabel kedua berarti dua tempat yang harus selalu sepakat, dan
    keduanya bisa melenceng tanpa ada yang tahu.
    """
    awal_bulan = timezone.localdate().replace(day=1)
    terpakai = (
        DailyQuota.objects.filter(user=user, date__gte=awal_bulan).aggregate(jumlah=Sum("count"))[
            "jumlah"
        ]
        or 0
    )
    return max(0, settings.MONTHLY_AI_QUOTA - terpakai)


def _awal_hari_ini() -> datetime:
    """Batas bawah hari ini sebagai datetime, supaya indeks (user, created_at)
    tetap terpakai. `created_at__date=` memaksa fungsi atas kolomnya dan
    membuat indeksnya dilewati."""
    return timezone.make_aware(
        datetime.combine(timezone.localdate(), time.min),
        timezone.get_current_timezone(),
    )


def sisa_kuota_endpoint(user: User, endpoint: str) -> int | None:
    """Sisa jatah satu alat hari ini, atau None kalau alat itu tidak dibatasi.

    Dihitung dari UsageLog, bukan dari penghitung tersendiri, dengan alasan
    yang sama seperti kuota bulanan: satu sumber angka, tidak ada dua tempat
    yang bisa berselisih. Barisnya sedikit — batas hariannya sendiri yang
    menjaga itu.
    """
    batas = settings.KUOTA_HARIAN_ENDPOINT.get(endpoint)
    if batas is None:
        return None

    terpakai = UsageLog.objects.filter(
        user=user, endpoint=endpoint, created_at__gte=_awal_hari_ini()
    ).count()
    return max(0, batas - terpakai)


def sisa_kuota(user: User, endpoint: str = "") -> int:
    """Angka yang ditampilkan ke user: yang paling ketat dari semua batas.

    Kalau yang ditampilkan cuma sisa harian, seorang user bisa melihat "masih
    15" lalu ditolak karena jatah bulanannya habis — angka yang berbohong
    lebih buruk daripada tidak ada angka.
    """
    semua = [sisa_kuota_harian(user), sisa_kuota_bulanan(user)]
    sisa_alat = sisa_kuota_endpoint(user, endpoint) if endpoint else None
    if sisa_alat is not None:
        semua.append(sisa_alat)
    return min(semua)


def pastikan_kuota_cukup(user: User, endpoint: str = "") -> None:
    """Melempar turunan AIServiceError kalau salah satu jatah sudah habis.

    Dipanggil SEBELUM Gemini dihubungi — kalau setelahnya, biayanya sudah
    terlanjur keluar dan penolakannya jadi tidak ada gunanya.

    Urutan pemeriksaannya sengaja dari yang paling sempit ke paling luas,
    supaya pesan yang diterima user adalah pesan yang paling bisa
    ditindaklanjuti: "jatah carousel habis, alat lain masih bisa" lebih
    berguna daripada "kuota harian habis" kalau memang alat lain masih bisa.
    """
    # Izin eksplisit, BUKAN is_staff.
    #
    # is_staff artinya "bisa masuk admin". Memakainya di sini berarti setiap
    # orang yang diberi akses admin — operasional, CS, siapa pun — ikut
    # mendapat belanja AI tanpa batas, diam-diam, pada hari aksesnya diberikan.
    # Superuser tetap lolos karena Django memberi superuser semua izin.
    if user.has_perm("usage.bypass_quota"):
        return

    sisa_alat = sisa_kuota_endpoint(user, endpoint) if endpoint else None
    if sisa_alat is not None and sisa_alat <= 0:
        logger.info("Kuota %s habis untuk %s.", endpoint, user.email)
        raise KuotaEndpointHabis(PESAN_PER_ENDPOINT.get(endpoint, PESAN_KUOTA_ENDPOINT))

    if sisa_kuota_harian(user) <= 0:
        logger.info("Kuota harian habis untuk %s.", user.email)
        raise KuotaHarianHabis()

    if sisa_kuota_bulanan(user) <= 0:
        logger.info("Kuota bulanan habis untuk %s.", user.email)
        raise KuotaBulananHabis()


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
        prompt_tokens=metrik.token_masuk if metrik else 0,
        output_tokens=metrik.token_keluar if metrik else 0,
    )

    # get_or_create + F(): dua permintaan yang datang bersamaan tetap menaikkan
    # hitungan dua kali, bukan saling menimpa.
    kuota, _ = DailyQuota.objects.get_or_create(user=user, date=timezone.localdate())
    DailyQuota.objects.filter(pk=kuota.pk).update(count=F("count") + 1)
