"""Tindakan panel: yang MENGUBAH keadaan, bukan sekadar membacanya.

Semuanya meninggalkan jejak siapa yang melakukannya. Panel dipakai lebih dari
satu orang, dan "siapa yang menaikkan jatah orang ini?" adalah pertanyaan yang
pasti muncul suatu hari.
"""

from __future__ import annotations

import logging
import secrets
from typing import Any

from rest_framework import serializers

from apps.accounts.kirim import kirim_kredensial
from apps.panel.models import BonusKuota
from apps.usage.kuota import sisa_kuota_bulanan, sisa_kuota_harian

logger = logging.getLogger(__name__)

# Batas atas satu pemberian bonus. Bukan ketidakpercayaan pada operasional,
# melainkan penjagaan terhadap salah ketik: "500" yang dimaksud "50" tidak
# boleh menjadi tagihan yang tidak bisa ditarik kembali.
BONUS_MAKS = 50


def beri_bonus_kuota(user: Any, *, jumlah: Any, alasan: str, oleh: Any) -> dict[str, Any]:
    """Tambah jatah pemakaian untuk HARI INI saja.

    Hanya hari ini, jadi ia habis sendiri tanpa perlu dibatalkan siapa pun —
    cara paling andal untuk tidak lupa adalah tidak perlu ingat.
    """
    try:
        angka = int(jumlah)
    except (TypeError, ValueError) as exc:
        raise serializers.ValidationError({"error": "Jumlah tambahan harus berupa angka."}) from exc

    if angka < 1 or angka > BONUS_MAKS:
        raise serializers.ValidationError(
            {"error": f"Tambahan jatah harus antara 1 dan {BONUS_MAKS}."}
        )

    BonusKuota.objects.create(user=user, jumlah=angka, alasan=alasan, diberikan_oleh=oleh)
    logger.info("Bonus kuota %s untuk %s oleh %s.", angka, user.email, oleh.email)

    return {
        "pesan": f"Jatah {user.email} hari ini ditambah {angka} panggilan.",
        "sisa_hari_ini": sisa_kuota_harian(user),
        "sisa_bulan_ini": sisa_kuota_bulanan(user),
    }


def reset_kata_sandi(user: Any) -> dict[str, Any]:
    """Buat kata sandi baru dan paksa diganti saat masuk.

    Dikembalikan sekali di sini supaya bisa dikirim lewat WhatsApp, lalu
    disimpan hanya sebagai hash — sama seperti akun yang lahir dari webhook.
    """
    kata_sandi = secrets.token_urlsafe(9)
    user.set_password(kata_sandi)
    user.must_change_password = True
    user.save(update_fields=["password", "must_change_password"])
    logger.info("Kata sandi %s direset lewat panel.", user.email)

    return {
        "pesan": (
            "Kata sandi baru dibuat. Kirimkan ke pembeli, "
            "dan ia akan diminta menggantinya saat masuk."
        ),
        "kata_sandi": kata_sandi,
    }


def kirim_ulang_kredensial(user: Any) -> dict[str, Any]:
    """Buat kata sandi baru DAN kirimkan lewat email, sekali tekan.

    Digabung dengan sengaja. Yang dibutuhkan operasional saat pembeli menelepon
    bukan "reset kata sandi" lalu "kirim email" sebagai dua langkah terpisah —
    yang dibutuhkan adalah pembeli itu bisa masuk. Memisahkannya cuma
    menyediakan satu langkah untuk dilupakan, dan yang terlupa selalu langkah
    kedua.
    """
    kata_sandi = secrets.token_urlsafe(9)
    user.set_password(kata_sandi)
    user.must_change_password = True
    user.save(update_fields=["password", "must_change_password"])

    terkirim = kirim_kredensial(user, kata_sandi)
    logger.info("Kredensial %s dibuat ulang lewat panel, terkirim=%s.", user.email, terkirim)

    if terkirim:
        return {
            "pesan": f"Kata sandi baru sudah dikirim ke {user.email}.",
            "terkirim": True,
        }

    # Emailnya gagal, tapi kata sandinya sudah telanjur berganti. Menyembunyikan
    # kata sandi itu berarti akunnya terkunci untuk semua orang, termasuk
    # pemiliknya. Jadi dikembalikan supaya bisa dikirim manual lewat WhatsApp.
    return {
        "pesan": (
            "Kata sandi baru dibuat, TAPI emailnya gagal terkirim. Kirimkan manual lewat WhatsApp."
        ),
        "terkirim": False,
        "kata_sandi": kata_sandi,
    }


def ubah_aktif(user: Any, *, aktif: bool) -> dict[str, Any]:
    """Nonaktifkan atau aktifkan kembali akun.

    Tidak ada penghapusan di panel: pembeli yang dihapus tidak bisa
    dikembalikan, dan riwayat pemakaiannya ikut hilang bersama alasan kenapa
    ia dihapus.
    """
    user.is_active = aktif
    user.save(update_fields=["is_active"])
    logger.info("Akun %s di-set aktif=%s lewat panel.", user.email, aktif)

    return {
        "pesan": (
            f"Akun {user.email} diaktifkan kembali."
            if aktif
            else f"Akun {user.email} dinonaktifkan. Ia tidak bisa masuk sampai diaktifkan lagi."
        ),
        "aktif": user.is_active,
    }
