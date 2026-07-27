"""Model akun.

Custom user dibuat sejak Fase 0 walaupun fitur auth baru dikerjakan di Fase 4:
Django hanya bisa memakai AUTH_USER_MODEL kustom kalau model itu sudah ada
sebelum migrasi pertama dijalankan. Mengubahnya belakangan berarti membongkar
seluruh database.

Tidak ada self-signup. Akun lahir dari webhook pembayaran (Fase 4) atau dari
perintah `manage.py buat_akun` untuk tester.
"""

from __future__ import annotations

from typing import Any

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Manager yang memakai email sebagai identitas, bukan username."""

    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra: Any) -> User:
        if not email:
            raise ValueError("Email wajib diisi.")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra: Any) -> User:
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email: str, password: str | None = None, **extra: Any) -> User:
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("must_change_password", False)
        if extra.get("is_staff") is not True:
            raise ValueError("Superuser harus punya is_staff=True.")
        if extra.get("is_superuser") is not True:
            raise ValueError("Superuser harus punya is_superuser=True.")
        return self._create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField("email", unique=True)
    full_name = models.CharField("nama lengkap", max_length=150, blank=True)
    whatsapp = models.CharField("nomor WhatsApp", max_length=30, blank=True)
    is_active = models.BooleanField("aktif", default=True)
    is_staff = models.BooleanField("bisa masuk admin", default=False)
    must_change_password = models.BooleanField("wajib ganti kata sandi", default=False)
    date_joined = models.DateTimeField("tanggal bergabung", default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        verbose_name = "pengguna"
        verbose_name_plural = "pengguna"
        ordering = ["-date_joined"]

    def __str__(self) -> str:
        return self.email

    def get_short_name(self) -> str:
        return self.full_name.split(" ")[0] if self.full_name else self.email


class License(models.Model):
    """Lisensi lifetime yang lahir dari pembayaran di affiliate.id."""

    class Status(models.TextChoices):
        PENDING = "pending", "menunggu"
        ACTIVE = "active", "aktif"
        REVOKED = "revoked", "dicabut"

    key = models.CharField("kunci lisensi", max_length=64, unique=True)
    user = models.ForeignKey(
        "accounts.User",
        verbose_name="pemilik",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="licenses",
    )
    plan = models.CharField("paket", max_length=30, default="lifetime")
    # order_id unik: inilah yang membuat webhook idempoten. Satu pembayaran
    # tidak boleh pernah menghasilkan dua lisensi, berapa kali pun dikirim ulang.
    order_id = models.CharField("nomor pesanan", max_length=120, unique=True)
    amount = models.DecimalField("nilai bayar", max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        "status", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    activated_at = models.DateTimeField("waktu aktivasi", null=True, blank=True)
    created_at = models.DateTimeField("dibuat", auto_now_add=True)

    class Meta:
        verbose_name = "lisensi"
        verbose_name_plural = "lisensi"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.key} ({self.get_status_display()})"


class WebhookEvent(models.Model):
    """Catatan mentah tiap webhook yang masuk.

    Disimpan sebelum diproses supaya kalau ada yang aneh, kejadiannya masih
    bisa ditelusuri. external_id unik = event yang sama tidak pernah diproses
    dua kali walau penyedia mengirimnya berulang.
    """

    provider = models.CharField("penyedia", max_length=50, default="affiliate.id")
    external_id = models.CharField("id dari penyedia", max_length=120, unique=True)
    payload = models.JSONField("isi kiriman", default=dict)
    signature_valid = models.BooleanField("tanda tangan sah", default=False)
    processed_at = models.DateTimeField("waktu diproses", null=True, blank=True)
    error = models.TextField("catatan galat", blank=True)
    created_at = models.DateTimeField("diterima", auto_now_add=True)

    class Meta:
        verbose_name = "kiriman webhook"
        verbose_name_plural = "kiriman webhook"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.provider}:{self.external_id}"
