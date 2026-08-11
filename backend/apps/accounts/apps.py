from django.apps import AppConfig
from django.db.models.signals import post_migrate


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    verbose_name = "Akun & Lisensi"

    def ready(self) -> None:
        # Peran disinkronkan SETELAH migrasi, bukan di dalamnya: baris
        # Permission sendiri baru dibuat pada tahap post_migrate, jadi data
        # migration yang mencarinya akan menemukan database yang masih kosong
        # dan membuat grup tanpa izin apa pun — diam-diam. Lihat peran.py.
        from apps.accounts.peran import sinkron_peran

        post_migrate.connect(sinkron_peran, sender=self)
