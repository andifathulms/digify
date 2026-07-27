"""Buat akun manual tanpa lewat webhook pembayaran.

Dipakai untuk tester dan untuk pembeli yang webhook-nya gagal masuk. Tidak ada
pendaftaran mandiri di aplikasi, jadi perintah ini satu-satunya jalan lain.

    docker compose exec backend python manage.py buat_akun budi@warung.id --nama "Pak Budi"
"""

from __future__ import annotations

import secrets
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.accounts.models import License, User
from apps.accounts.webhook import _kunci_lisensi


class Command(BaseCommand):
    help = "Buat satu akun beserta lisensi lifetime-nya."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("email", help="Email pemilik akun.")
        parser.add_argument("--nama", default="", help="Nama lengkap.")
        parser.add_argument("--whatsapp", default="", help="Nomor WhatsApp.")
        parser.add_argument(
            "--kata-sandi",
            default="",
            help="Kata sandi awal. Kalau kosong, dibuatkan acak.",
        )

    def handle(self, *args: Any, **opsi: Any) -> None:
        email = opsi["email"].strip().lower()

        if User.objects.filter(email=email).exists():
            raise CommandError(f"Akun dengan email {email} sudah ada.")

        kata_sandi = opsi["kata_sandi"] or secrets.token_urlsafe(9)
        user = User.objects.create_user(
            email=email,
            password=kata_sandi,
            full_name=opsi["nama"].strip(),
            whatsapp=opsi["whatsapp"].strip(),
            must_change_password=True,
        )
        lisensi = License.objects.create(
            key=_kunci_lisensi(),
            user=user,
            order_id=f"manual-{secrets.token_hex(6)}",
            status=License.Status.ACTIVE,
            activated_at=timezone.now(),
        )

        self.stdout.write(self.style.SUCCESS("Akun dibuat."))
        self.stdout.write(f"  Email       : {email}")
        self.stdout.write(f"  Kata sandi  : {kata_sandi}")
        self.stdout.write(f"  Kunci lisensi: {lisensi.key}")
        self.stdout.write("  Kata sandi wajib diganti saat pertama kali masuk.")
