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
    # Token, bukan sekadar jumlah panggilan. Kuota ada untuk menahan BIAYA,
    # dan biaya tidak bisa dilihat dari menghitung panggilan: satu carousel
    # 10 slide memakai dua kali lipat token carousel 4 slide.
    prompt_tokens = models.PositiveIntegerField("token masuk", default=0)
    output_tokens = models.PositiveIntegerField("token keluar", default=0)
    created_at = models.DateTimeField("waktu", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "catatan pemakaian"
        verbose_name_plural = "catatan pemakaian"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "created_at"])]
        permissions = [
            # Dipisah dari is_staff DENGAN SENGAJA.
            #
            # Sebelumnya kuota dilewati oleh `user.is_staff`, dan is_staff
            # artinya "bisa masuk admin". Jadi memberi seseorang akses admin
            # ikut memberinya belanja AI tanpa batas — dua hal yang tidak ada
            # hubungannya, dan tidak ada yang akan menghubungkannya saat
            # aksesnya diberikan.
            #
            # Superuser tetap otomatis punya izin ini (Django memberikan semua
            # izin ke superuser), jadi Owner tetap bisa mendemokan produknya.
            ("bypass_quota", "Boleh memakai AI tanpa batas kuota"),
        ]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.endpoint}:{self.status}"

    @property
    def biaya_rupiah(self) -> int:
        """Perkiraan biaya baris ini, dibulatkan ke rupiah penuh.

        Perkiraan, bukan tagihan: harga model bisa berubah tanpa kode ini ikut
        berubah, dan tagihan Google yang berlaku. Dipakai untuk menjawab
        "siapa yang mahal", bukan untuk pembukuan.
        """
        from django.conf import settings

        masuk = self.prompt_tokens * settings.HARGA_TOKEN_MASUK_PER_JUTA
        keluar = self.output_tokens * settings.HARGA_TOKEN_KELUAR_PER_JUTA
        return round((masuk + keluar) / 1_000_000)


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
