"""Daftar menu tersimpan milik tiap user.

Alasan keberadaannya (PRD §7.3): "satu daftar menu yang dipakai bersama semua
tab" adalah insight prioritas #1 dari Andi. Sebelum ini, user harus mengetik
ulang daftar menunya di Tab 3, lalu di Tab 4, lalu di Tab 5, lalu di Tab 7 —
di layar HP, dengan jempol. Itu titik paling mungkin orang menyerah.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models


class MenuItem(models.Model):
    class Status(models.TextChoices):
        GREEN = "GREEN", "pertahankan"
        YELLOW = "YELLOW", "perbaiki harga"
        RED = "RED", "perlu ditinjau"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="pemilik",
        on_delete=models.CASCADE,
        related_name="menu_items",
    )
    name = models.CharField("nama menu", max_length=200)
    # Uang disimpan sebagai Decimal, tidak pernah float (CLAUDE.md §6).
    cogs = models.DecimalField("biaya bahan", max_digits=12, decimal_places=0, default=0)
    price = models.DecimalField("harga jual", max_digits=12, decimal_places=0, default=0)
    weekly_sales = models.DecimalField(
        "terjual per minggu", max_digits=10, decimal_places=0, default=0
    )
    status = models.CharField(
        "status", max_length=10, choices=Status.choices, blank=True, default=""
    )
    updated_at = models.DateTimeField("terakhir diubah", auto_now=True)
    created_at = models.DateTimeField("dibuat", auto_now_add=True)

    class Meta:
        verbose_name = "menu tersimpan"
        verbose_name_plural = "menu tersimpan"
        ordering = ["name"]
        constraints = [
            # Satu nama menu hanya sekali per warung. Tanpa ini, menyimpan dua
            # kali dari tab berbeda menghasilkan daftar berisi duplikat.
            models.UniqueConstraint(fields=["user", "name"], name="menu_unik_per_user")
        ]

    def __str__(self) -> str:
        return self.name
