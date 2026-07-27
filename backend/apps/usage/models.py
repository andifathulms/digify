"""Pencatatan pemakaian AI dan kuota harian.

Kenapa ini ada: akses lifetime dibayar sekali, tapi tiap panggilan AI menambah
tagihan Gemini setiap hari selamanya. Tanpa batas, satu user yang menekan
tombol berulang-ulang bisa menghabiskan biaya lebih besar daripada yang pernah
ia bayar (PRD §8.3, §12).
"""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class UsageLog(models.Model):
    """Satu baris per panggilan AI, berhasil maupun gagal.

    Yang gagal ikut dicatat: kalau sebuah endpoint sering gagal, itu ketahuan
    di sini sebelum ada pembeli yang mengeluh.
    """

    class Status(models.TextChoices):
        OK = "ok", "berhasil"
        ERROR = "error", "gagal"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="pengguna",
        on_delete=models.CASCADE,
        related_name="usage_logs",
    )
    endpoint = models.CharField("endpoint", max_length=60)
    status = models.CharField("status", max_length=10, choices=Status.choices)
    latency_ms = models.PositiveIntegerField("lama proses (ms)", default=0)
    retry_count = models.PositiveSmallIntegerField("jumlah pengulangan", default=0)
    created_at = models.DateTimeField("waktu", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "catatan pemakaian"
        verbose_name_plural = "catatan pemakaian"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "created_at"])]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.endpoint}:{self.status}"


class DailyQuota(models.Model):
    """Hitungan pemakaian per user per hari.

    Sebenarnya bisa dihitung dari UsageLog, tapi disimpan terpisah supaya
    pemeriksaan kuota tetap satu baris SELECT walaupun catatannya sudah jutaan.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="pengguna",
        on_delete=models.CASCADE,
        related_name="daily_quotas",
    )
    date = models.DateField("tanggal", default=timezone.localdate)
    count = models.PositiveIntegerField("jumlah panggilan", default=0)

    class Meta:
        verbose_name = "kuota harian"
        verbose_name_plural = "kuota harian"
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="kuota_unik_per_user_per_hari")
        ]

    def __str__(self) -> str:
        return f"{self.user_id} {self.date}: {self.count}"
