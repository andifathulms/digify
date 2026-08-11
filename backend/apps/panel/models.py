"""Penyesuaian jatah pemakaian untuk satu pembeli.

Kenapa ada: kalau seorang pembeli mengeluh kehabisan jatah di tengah pekerjaan,
satu-satunya jalan hari ini adalah menaikkan batas untuk SEMUA orang lewat
`.env`, lalu menurunkannya lagi dan berharap tidak lupa. Itu mengubah keadaan
seluruh pembeli demi satu orang.

Bonus di sini hanya berlaku untuk hari yang ditulis, jadi ia habis sendiri.
Tidak ada yang perlu diingat untuk dibatalkan — cara paling andal untuk tidak
lupa adalah tidak perlu ingat.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class BonusKuota(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="pengguna",
        on_delete=models.CASCADE,
        related_name="bonus_kuota",
    )
    date = models.DateField("berlaku untuk tanggal", default=timezone.localdate)
    jumlah = models.PositiveSmallIntegerField("tambahan panggilan")
    alasan = models.CharField("alasan", max_length=200, blank=True)
    diberikan_oleh = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="diberikan oleh",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bonus_diberikan",
    )
    created_at = models.DateTimeField("waktu", auto_now_add=True)

    class Meta:
        verbose_name = "bonus kuota"
        verbose_name_plural = "bonus kuota"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "date"])]

    def __str__(self) -> str:
        return f"{self.user_id}:+{self.jumlah}@{self.date}"
