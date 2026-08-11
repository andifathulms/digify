"""Test peran admin.

Kalau test di berkas ini gagal, artinya seseorang punya kuasa yang tidak
dimaksudkan untuknya. Itu bukan bug tampilan.
"""

from __future__ import annotations

import pytest
from django.contrib.auth.models import Group

from apps.accounts.models import User

pytestmark = pytest.mark.django_db


class TestGrupOperasional:
    def test_grup_ada_setelah_migrasi(self) -> None:
        """Dibuat lewat migrasi, bukan diklik di server: server baru, database
        uji, dan hasil restore harus lahir dengan peran yang sama."""
        assert Group.objects.filter(name="Operasional").exists()

    def test_operasional_boleh_melihat_pembeli_dan_pemakaiannya(self) -> None:
        orang = User.objects.create_user(email="ops@digify.id", password="rahasia-test-123")
        orang.groups.add(Group.objects.get(name="Operasional"))
        orang = User.objects.get(pk=orang.pk)  # buang cache izin

        assert orang.has_perm("accounts.view_user")
        assert orang.has_perm("accounts.view_license")
        assert orang.has_perm("usage.view_usagelog")

    def test_operasional_TIDAK_boleh_belanja_ai_tanpa_batas(self) -> None:
        """Inti pemisahan 11 Agustus 2026: akses admin bukan izin belanja."""
        orang = User.objects.create_user(email="ops@digify.id", password="rahasia-test-123")
        orang.groups.add(Group.objects.get(name="Operasional"))
        orang = User.objects.get(pk=orang.pk)

        assert not orang.has_perm("usage.bypass_quota")

    def test_operasional_TIDAK_boleh_menghapus_pembeli(self) -> None:
        """Menghapus pembeli tidak pernah jadi jalan keluar; menonaktifkan
        sudah cukup dan bisa dibatalkan."""
        orang = User.objects.create_user(email="ops@digify.id", password="rahasia-test-123")
        orang.groups.add(Group.objects.get(name="Operasional"))
        orang = User.objects.get(pk=orang.pk)

        assert not orang.has_perm("accounts.delete_user")

    def test_operasional_TIDAK_boleh_menaikkan_izinnya_sendiri(self) -> None:
        orang = User.objects.create_user(email="ops@digify.id", password="rahasia-test-123")
        orang.groups.add(Group.objects.get(name="Operasional"))
        orang = User.objects.get(pk=orang.pk)

        assert not orang.has_perm("auth.change_group")
        assert not orang.has_perm("auth.change_permission")


class TestOwner:
    def test_superuser_punya_semua_izin_termasuk_bypass_kuota(self) -> None:
        owner = User.objects.create_superuser(email="owner@digify.id", password="rahasia-test-123")
        assert owner.has_perm("usage.bypass_quota")
        assert owner.has_perm("accounts.delete_user")
