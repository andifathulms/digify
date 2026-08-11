"""Pengiriman kredensial ke pembeli.

Kenapa berkas ini ada, dan kenapa ia yang paling menghalangi penjualan:
webhook membuat akun lalu mengembalikan kata sandi awal di dalam respons HTTP
ke affiliate.id. Tidak ada satu baris pun yang mengirimkannya ke pembelinya.
Artinya: orang bayar → akun jadi → dia tidak pernah tahu kata sandinya → tidak
bisa masuk (docs/PRODUKSI.md §6.1).

Emailnya sengaja teks biasa, bukan HTML. Yang dikirim cuma alamat masuk, email,
dan kata sandi — HTML tidak menambah satu pun kejelasan, tapi menambah
kemungkinan tersaring sebagai spam, dan itu tepat pada satu email yang paling
tidak boleh hilang.
"""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)

JUDUL = "Akun Digify Laris Anda sudah aktif"

BADAN = """Halo{sapaan},

Terima kasih sudah bergabung dengan Digify Laris — Hitung Untung Menu.

Akun Anda sudah aktif dan bisa langsung dipakai:

    Alamat masuk : {url}
    Email        : {email}
    Kata sandi   : {kata_sandi}

Saat pertama kali masuk, Anda akan diminta mengganti kata sandi di atas dengan
buatan Anda sendiri. Simpan yang baru itu baik-baik.

Kalau ada yang tidak jalan, balas saja email ini.

Salam,
Digify Laris
"""


def kirim_kredensial(user: Any, kata_sandi: str) -> bool:
    """Kirim email berisi kata sandi awal. Kembalikan True kalau terkirim.

    TIDAK pernah melempar exception. Kegagalan mengirim email tidak boleh
    menggagalkan pembuatan akun yang sudah berhasil — pembelinya sudah membayar,
    dan akun yang batal dibuat jauh lebih sulit diperbaiki daripada email yang
    perlu dikirim ulang. Yang gagal ditandai lewat `kredensial_terkirim_at`
    yang tetap kosong, dan panel menampilkannya supaya tidak lewat diam-diam.
    """
    sapaan = f" {user.full_name.split(' ')[0]}" if user.full_name else ""
    isi = BADAN.format(
        sapaan=sapaan,
        url=settings.URL_APLIKASI,
        email=user.email,
        kata_sandi=kata_sandi,
    )

    try:
        terkirim = send_mail(
            subject=JUDUL,
            message=isi,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception:
        # Isi kata sandinya TIDAK ikut dicatat ke log.
        logger.exception("Gagal mengirim kredensial ke %s.", user.email)
        return False

    if not terkirim:
        logger.error("Kredensial untuk %s tidak terkirim (0 email diterima server).", user.email)
        return False

    user.kredensial_terkirim_at = timezone.now()
    user.save(update_fields=["kredensial_terkirim_at"])
    logger.info("Kredensial terkirim ke %s.", user.email)
    return True
