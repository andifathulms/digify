"""Pemrosesan webhook pembayaran affiliate.id.

Aturan keras (PRD §8.1):
- Tanda tangan diverifikasi sebelum apa pun diproses.
- Idempoten: satu `order_id` hanya pernah menghasilkan satu akun dan satu
  lisensi, berapa kali pun penyedia mengirim ulang.
- Event yang sudah pernah diproses tetap dibalas 200. Membalas error membuat
  penyedia mengirim ulang terus-menerus tanpa henti.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
from dataclasses import dataclass
from typing import Any

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.accounts.kirim import kirim_kredensial
from apps.accounts.models import License, User, WebhookEvent

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class HasilWebhook:
    """Apa yang terjadi pada satu kiriman webhook."""

    dibuat_baru: bool
    user: User | None
    license: License | None
    kata_sandi_awal: str | None


def tanda_tangan_sah(isi_mentah: bytes, tanda_tangan: str) -> bool:
    """Cocokkan tanda tangan HMAC-SHA256 dari penyedia.

    compare_digest, bukan `==`: perbandingan biasa berhenti di byte pertama
    yang berbeda, dan selisih waktunya bisa dipakai menebak tanda tangan.
    """
    rahasia = settings.AFFILIATE_ID_WEBHOOK_SECRET
    if not rahasia:
        logger.error("AFFILIATE_ID_WEBHOOK_SECRET kosong — webhook ditolak semua.")
        return False
    if not tanda_tangan:
        return False

    diharapkan = hmac.new(rahasia.encode(), isi_mentah, hashlib.sha256).hexdigest()
    return hmac.compare_digest(diharapkan, tanda_tangan.strip().lower())


def _kunci_lisensi() -> str:
    """Kunci lisensi acak, dikelompokkan supaya enak dibaca dan didiktekan
    lewat telepon: DGF-XXXX-XXXX-XXXX."""
    abjad = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # tanpa 0/O/1/I yang mudah tertukar
    blok = ["".join(secrets.choice(abjad) for _ in range(4)) for _ in range(3)]
    return "DGF-" + "-".join(blok)


def _kata_sandi_awal() -> str:
    return secrets.token_urlsafe(9)


@transaction.atomic
def proses_pembayaran(
    *,
    external_id: str,
    order_id: str,
    email: str,
    payload: dict[str, Any],
    nama: str = "",
    whatsapp: str = "",
    amount: float = 0,
    signature_valid: bool = True,
) -> HasilWebhook:
    """Buat akun + lisensi dari satu pembayaran. Aman dipanggil berulang.

    Mengembalikan `dibuat_baru=False` kalau event ini sudah pernah diproses —
    pemanggil tetap membalas 200.
    """
    try:
        with transaction.atomic():
            event = WebhookEvent.objects.create(
                provider="affiliate.id",
                external_id=external_id,
                payload=payload,
                signature_valid=signature_valid,
            )
    except IntegrityError:
        # external_id unik sudah ada: kiriman ulang. Berhenti di sini.
        logger.info("Webhook %s sudah pernah diproses, diabaikan.", external_id)
        return HasilWebhook(False, None, None, None)

    lisensi_ada = License.objects.select_related("user").filter(order_id=order_id).first()
    if lisensi_ada:
        # Pesanan yang sama datang lagi dengan external_id berbeda. Tetap tidak
        # boleh membuat akun kedua.
        logger.info("Pesanan %s sudah punya lisensi, tidak dibuat ulang.", order_id)
        event.processed_at = timezone.now()
        event.save(update_fields=["processed_at"])
        return HasilWebhook(False, lisensi_ada.user, lisensi_ada, None)

    email_bersih = email.strip().lower()
    user = User.objects.filter(email=email_bersih).first()
    kata_sandi_awal: str | None = None

    if user is None:
        kata_sandi_awal = _kata_sandi_awal()
        user = User.objects.create_user(
            email=email_bersih,
            password=kata_sandi_awal,
            full_name=nama.strip(),
            whatsapp=whatsapp.strip(),
            # Kata sandi acak dikirim lewat email/WhatsApp, jadi harus diganti
            # begitu user pertama kali masuk.
            must_change_password=True,
        )

    lisensi = License.objects.create(
        key=_kunci_lisensi(),
        user=user,
        order_id=order_id,
        amount=amount,
        status=License.Status.ACTIVE,
        activated_at=timezone.now(),
    )

    event.processed_at = timezone.now()
    event.save(update_fields=["processed_at"])

    # Dikirim SETELAH transaksi benar-benar tersimpan.
    #
    # Kalau dikirim di dalam transaksi, sebuah kegagalan sesudahnya akan
    # membatalkan akunnya tapi TIDAK bisa menarik kembali email yang sudah
    # meluncur — pembeli memegang kata sandi untuk akun yang tidak ada. Ini
    # satu-satunya bagian di sini yang tidak bisa dibatalkan, jadi ia berjalan
    # paling akhir.
    if kata_sandi_awal:
        transaction.on_commit(lambda: kirim_kredensial(user, kata_sandi_awal))

    logger.info("Akun & lisensi dibuat untuk pesanan %s (%s).", order_id, email_bersih)
    return HasilWebhook(True, user, lisensi, kata_sandi_awal)
