"""Peran admin dan izin yang menyertainya — satu sumber kebenaran.

Kenapa disinkronkan lewat sinyal `post_migrate` dan BUKAN lewat data migration:
Django membuat baris `Permission` di dalam sinyal `post_migrate`, yang berjalan
SETELAH seluruh migrasi selesai. Data migration yang mencari izin karena itu
tidak menemukan apa-apa pada database yang masih kosong, lalu membuat grup
tanpa satu pun izin — diam-diam, tanpa error. Persis kegagalan yang paling
ingin dihindari: server baru lahir dengan peran yang kelihatannya ada tapi
tidak berisi apa-apa, dan yang menemukannya pertama adalah orang yang tiba-tiba
tidak bisa mengerjakan tugasnya.

Kenapa Grup dan bukan kolom `role` di User: Django sudah punya sistem izin yang
tersambung ke `has_perm` dan ke halaman admin. Kolom `role` sendiri berarti
sistem kedua yang harus dijaga sejalan dengan yang pertama, selamanya.

Menambah peran baru (CS, Keuangan) nanti cukup menambah entri di PERAN — tanpa
migrasi, tanpa mengubah kode lain. Sinkronisasi berjalan tiap kali `migrate`
dijalankan, dan menyesuaikan izin grup yang sudah ada, bukan menduakannya.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# Nama grup dipakai di kode dan di layar admin. Mengganti namanya begitu saja
# membuat anggota lama kehilangan seluruh izinnya tanpa pesan apa pun.
OPERASIONAL = "Operasional"

# Izin per peran, ditulis sebagai "app_label.codename".
#
# Yang SENGAJA tidak diberikan ke Operasional:
# - usage.bypass_quota   → belanja AI tanpa batas; itu keputusan Owner
# - accounts.delete_user → menghapus pembeli tidak pernah jadi jalan keluar;
#                          menonaktifkan sudah cukup dan bisa dibatalkan
# - auth.*               → supaya seorang operasional tidak bisa menaikkan
#                          izinnya sendiri
PERAN: dict[str, list[str]] = {
    OPERASIONAL: [
        "accounts.view_user",
        "accounts.change_user",
        "accounts.add_user",
        "accounts.view_license",
        "accounts.change_license",
        "accounts.view_webhookevent",
        "usage.view_usagelog",
        "usage.view_dailyquota",
        "usage.change_dailyquota",
        "catalog.view_menuitem",
    ],
}


def sinkron_peran(**_: Any) -> None:
    """Buat grup peran dan samakan izinnya dengan PERAN di atas.

    Dipanggil dari sinyal `post_migrate`, jadi ia berjalan setiap kali
    `migrate` selesai — termasuk saat database uji dibangun. Aman diulang.
    """
    from django.apps import apps as daftar_aplikasi
    from django.contrib.auth.management import create_permissions
    from django.contrib.auth.models import Group, Permission

    # Paksa izin seluruh aplikasi dibuat lebih dulu.
    #
    # `post_migrate` menyala PER APLIKASI, dan sinyal ini menempel pada
    # accounts — yang berjalan sebelum usage dan catalog. Tanpa baris ini,
    # izin milik aplikasi yang belum sempat jalan tidak ditemukan, dan
    # Operasional lahir bisa melihat pembeli tapi tidak bisa melihat
    # pemakaiannya. Fungsinya idempoten, jadi memanggilnya aman.
    for app_config in daftar_aplikasi.get_app_configs():
        create_permissions(app_config, verbosity=0)

    for nama_peran, daftar_izin in PERAN.items():
        grup, _ = Group.objects.get_or_create(name=nama_peran)

        izin = []
        for jalur in daftar_izin:
            app_label, codename = jalur.split(".", 1)
            satu = Permission.objects.filter(
                codename=codename, content_type__app_label=app_label
            ).first()
            if satu is None:
                # Bukan alasan menggagalkan seluruh migrasi dan deploy
                # bersamanya, tapi harus terdengar: peran yang kurang izin
                # akan terasa sebagai "kenapa saya tidak bisa membuka ini".
                logger.warning(
                    "Izin %s tidak ditemukan saat menyiapkan peran %s.", jalur, nama_peran
                )
                continue
            izin.append(satu)

        # set(), bukan add(): izin yang dicabut dari daftar di atas harus ikut
        # hilang dari grupnya. add() saja membuat izin lama menempel selamanya.
        grup.permissions.set(izin)
