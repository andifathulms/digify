"""Hitungan untuk panel pengawasan.

Semua logika ada di sini, bukan di view (CLAUDE.md §6). View-nya tipis: minta
angka, kembalikan Response.

Nama field di sini TIDAK terikat kontrak `docs/API_CONTRACT.md` — kontrak itu
mengunci 9 endpoint optimizer, dan panel bukan salah satunya. Tetap ditulis
konsisten Bahasa Indonesia supaya tidak menambah campuran baru.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone

from apps.accounts.models import License, WebhookEvent
from apps.usage.kuota import sisa_kuota_bulanan, sisa_kuota_harian
from apps.usage.models import DailyQuota, UsageLog

User = get_user_model()


def rupiah_dari_token(token_masuk: int, token_keluar: int) -> int:
    """Perkiraan biaya, dibulatkan ke rupiah penuh.

    Perkiraan, bukan tagihan: harga model bisa berubah tanpa kode ini ikut
    berubah. Dipakai untuk menjawab "siapa yang mahal", bukan untuk pembukuan.
    """
    masuk = token_masuk * settings.HARGA_TOKEN_MASUK_PER_JUTA
    keluar = token_keluar * settings.HARGA_TOKEN_KELUAR_PER_JUTA
    return round((masuk + keluar) / 1_000_000)


def _awal_bulan() -> date:
    return timezone.localdate().replace(day=1)


def ringkasan() -> dict[str, Any]:
    """Jawaban enam pertanyaan panel, dalam satu layar.

    Urutannya mengikuti seberapa mahal akibatnya kalau tidak ketahuan, bukan
    mengikuti urutan tabel: pembeli yang gagal dapat akun lebih dulu daripada
    berapa uang masuk.
    """
    hari_ini = timezone.localdate()
    awal_bulan = _awal_bulan()
    sejak_24jam = timezone.now() - timedelta(hours=24)

    pakai_bulan_ini = UsageLog.objects.filter(created_at__date__gte=awal_bulan).aggregate(
        panggilan=Count("id"),
        token_masuk=Sum("prompt_tokens"),
        token_keluar=Sum("output_tokens"),
    )

    pakai_hari_ini = UsageLog.objects.filter(created_at__date=hari_ini).aggregate(
        panggilan=Count("id"),
        token_masuk=Sum("prompt_tokens"),
        token_keluar=Sum("output_tokens"),
    )

    # Alat mana yang sebenarnya dipakai. Ini satu-satunya angka di panel yang
    # menjawab pertanyaan produk, bukan pertanyaan operasional: fitur yang
    # tidak pernah dipakai tidak layak dirawat, dan tanpa daftar ini tidak ada
    # yang tahu yang mana.
    per_alat = (
        UsageLog.objects.filter(created_at__date__gte=awal_bulan)
        .values("endpoint")
        .annotate(
            panggilan=Count("id"),
            gagal=Count("id", filter=Q(status=UsageLog.Status.ERROR)),
            token_masuk=Sum("prompt_tokens"),
            token_keluar=Sum("output_tokens"),
        )
        .order_by("-panggilan")
    )

    # Perkiraan siapa yang mentok jatah hari ini.
    #
    # Perkiraan, dan batasnya nyata: penolakan kuota terjadi SEBELUM pemakaian
    # dicatat, jadi tidak ada satu baris pun yang merekam "ditolak". Yang bisa
    # dihitung cuma yang hitungannya sudah menyentuh batas. Kalau angka ini
    # sering tidak nol, batasnya memang terlalu ketat.
    mentok_kuota = DailyQuota.objects.filter(
        date=hari_ini, count__gte=settings.DAILY_AI_QUOTA
    ).count()

    pembeli_baru = User.objects.filter(is_staff=False, date_joined__date__gte=awal_bulan).count()

    pakai_24jam = UsageLog.objects.filter(created_at__gte=sejak_24jam).aggregate(
        panggilan=Count("id"),
        gagal=Count("id", filter=Q(status=UsageLog.Status.ERROR)),
        # Rata-rata hanya dari yang BERHASIL. Panggilan gagal biasanya kembali
        # dalam 200 ms, dan mencampurnya membuat rata-rata terlihat membaik
        # justru ketika layanannya sedang rusak.
        rata_lama=Avg("latency_ms", filter=Q(status=UsageLog.Status.OK)),
    )
    panggilan_24jam = pakai_24jam["panggilan"] or 0
    gagal_24jam = pakai_24jam["gagal"] or 0

    # Webhook bermasalah = orang yang sudah membayar tapi mungkin tidak pernah
    # menerima akun. Ini yang paling mahal kalau lewat tanpa ketahuan.
    webhook_bermasalah = WebhookEvent.objects.filter(
        Q(signature_valid=False) | Q(processed_at__isnull=True) | ~Q(error="")
    ).count()

    lisensi = License.objects.aggregate(
        total=Count("id"),
        aktif=Count("id", filter=Q(status=License.Status.ACTIVE)),
        bulan_ini=Count("id", filter=Q(created_at__date__gte=awal_bulan)),
        rupiah_bulan_ini=Sum("amount", filter=Q(created_at__date__gte=awal_bulan)),
    )

    # Sudah bayar tapi belum pernah masuk: kredensialnya mungkin tidak sampai.
    belum_pernah_masuk = User.objects.filter(
        is_active=True, is_staff=False, last_login__isnull=True
    ).count()

    # Lebih tajam daripada di atas: ini yang kita TAHU kredensialnya tidak
    # pernah terkirim, bukan sekadar belum dipakai masuk.
    kredensial_belum_terkirim = User.objects.filter(
        is_active=True, is_staff=False, kredensial_terkirim_at__isnull=True, last_login__isnull=True
    ).count()

    biaya_bulan_ini = rupiah_dari_token(
        pakai_bulan_ini["token_masuk"] or 0, pakai_bulan_ini["token_keluar"] or 0
    )
    biaya_hari_ini = rupiah_dari_token(
        pakai_hari_ini["token_masuk"] or 0, pakai_hari_ini["token_keluar"] or 0
    )
    pembeli_aktif = User.objects.filter(is_active=True, is_staff=False).count()

    return {
        "tanggal": hari_ini.isoformat(),
        "webhook_bermasalah": webhook_bermasalah,
        "kesehatan_ai": {
            "panggilan_24jam": panggilan_24jam,
            "gagal_24jam": gagal_24jam,
            # Persentase dibulatkan; yang dicari "apakah ada yang tidak beres",
            # bukan angka desimalnya.
            "persen_gagal_24jam": (
                round(gagal_24jam / panggilan_24jam * 100) if panggilan_24jam else 0
            ),
        },
        "biaya_bulan_ini_rupiah": biaya_bulan_ini,
        "panggilan_bulan_ini": pakai_bulan_ini["panggilan"] or 0,
        "biaya_hari_ini_rupiah": biaya_hari_ini,
        "panggilan_hari_ini": pakai_hari_ini["panggilan"] or 0,
        # Biaya rata-rata per pembeli, langsung bisa dibandingkan dengan harga
        # lifetime yang ia bayar sekali.
        "biaya_per_pembeli_rupiah": (
            round(biaya_bulan_ini / pembeli_aktif) if pembeli_aktif else 0
        ),
        "rata_lama_ms": round(pakai_24jam["rata_lama"] or 0),
        "mentok_kuota_hari_ini": mentok_kuota,
        "pembeli_baru_bulan_ini": pembeli_baru,
        "pemakaian_per_alat": [
            {
                "endpoint": baris["endpoint"],
                "panggilan": baris["panggilan"],
                "gagal": baris["gagal"],
                "biaya_rupiah": rupiah_dari_token(
                    baris["token_masuk"] or 0, baris["token_keluar"] or 0
                ),
            }
            for baris in per_alat
        ],
        "pembeli_aktif": pembeli_aktif,
        "belum_pernah_masuk": belum_pernah_masuk,
        "kredensial_belum_terkirim": kredensial_belum_terkirim,
        "lisensi": {
            "total": lisensi["total"] or 0,
            "aktif": lisensi["aktif"] or 0,
            "bulan_ini": lisensi["bulan_ini"] or 0,
            "rupiah_bulan_ini": int(lisensi["rupiah_bulan_ini"] or 0),
        },
    }


def daftar_klien(cari: str = "") -> list[dict[str, Any]]:
    """Satu baris per pembeli, beserta pemakaian dan perkiraan biayanya.

    Staff tidak ikut: yang diawasi di sini pembeli, dan akun internal yang
    tercampur di daftar hanya membuat angka totalnya menyesatkan.
    """
    awal_bulan = _awal_bulan()
    hari_ini = timezone.localdate()

    pengguna = User.objects.filter(is_staff=False)
    if cari:
        pengguna = pengguna.filter(
            Q(email__icontains=cari) | Q(full_name__icontains=cari) | Q(whatsapp__icontains=cari)
        )

    pengguna = pengguna.annotate(
        panggilan_bulan_ini=Count(
            "usage_logs", filter=Q(usage_logs__created_at__date__gte=awal_bulan)
        ),
        token_masuk_bulan_ini=Sum(
            "usage_logs__prompt_tokens", filter=Q(usage_logs__created_at__date__gte=awal_bulan)
        ),
        token_keluar_bulan_ini=Sum(
            "usage_logs__output_tokens", filter=Q(usage_logs__created_at__date__gte=awal_bulan)
        ),
        panggilan_hari_ini=Count("usage_logs", filter=Q(usage_logs__created_at__date=hari_ini)),
        gagal_bulan_ini=Count(
            "usage_logs",
            filter=Q(usage_logs__created_at__date__gte=awal_bulan)
            & Q(usage_logs__status=UsageLog.Status.ERROR),
        ),
    ).order_by("-panggilan_bulan_ini", "email")

    hasil = []
    for satu in pengguna.select_related():
        biaya = rupiah_dari_token(satu.token_masuk_bulan_ini or 0, satu.token_keluar_bulan_ini or 0)
        hasil.append(
            {
                "id": satu.id,
                "email": satu.email,
                "nama": satu.full_name,
                "whatsapp": satu.whatsapp,
                "aktif": satu.is_active,
                "bergabung": satu.date_joined.date().isoformat(),
                "terakhir_masuk": (satu.last_login.date().isoformat() if satu.last_login else None),
                "belum_pernah_masuk": satu.last_login is None,
                "kredensial_terkirim": satu.kredensial_terkirim_at is not None,
                "panggilan_hari_ini": satu.panggilan_hari_ini,
                "panggilan_bulan_ini": satu.panggilan_bulan_ini,
                "gagal_bulan_ini": satu.gagal_bulan_ini,
                "biaya_bulan_ini_rupiah": biaya,
                "sisa_hari_ini": sisa_kuota_harian(satu),
                "sisa_bulan_ini": sisa_kuota_bulanan(satu),
            }
        )
    return hasil


def detail_klien(user: Any) -> dict[str, Any]:
    """Satu pembeli: lisensi, pemakaian per alat, dan panggilan terakhirnya."""
    awal_bulan = _awal_bulan()

    per_alat = (
        UsageLog.objects.filter(user=user, created_at__date__gte=awal_bulan)
        .values("endpoint")
        .annotate(
            panggilan=Count("id"),
            gagal=Count("id", filter=Q(status=UsageLog.Status.ERROR)),
            token_masuk=Sum("prompt_tokens"),
            token_keluar=Sum("output_tokens"),
        )
        .order_by("-panggilan")
    )

    terakhir = UsageLog.objects.filter(user=user).order_by("-created_at")[:20]

    lisensi = License.objects.filter(user=user).order_by("-created_at")

    return {
        "id": user.id,
        "email": user.email,
        "nama": user.full_name,
        "whatsapp": user.whatsapp,
        "aktif": user.is_active,
        "wajib_ganti_sandi": user.must_change_password,
        "kredensial_terkirim": user.kredensial_terkirim_at is not None,
        "bergabung": user.date_joined.date().isoformat(),
        "terakhir_masuk": user.last_login.date().isoformat() if user.last_login else None,
        "sisa_hari_ini": sisa_kuota_harian(user),
        "sisa_bulan_ini": sisa_kuota_bulanan(user),
        "lisensi": [
            {
                "key": satu.key,
                "status": satu.status,
                "order_id": satu.order_id,
                "amount": int(satu.amount or 0),
                "activated_at": (
                    satu.activated_at.date().isoformat() if satu.activated_at else None
                ),
            }
            for satu in lisensi
        ],
        "pemakaian_per_alat": [
            {
                "endpoint": baris["endpoint"],
                "panggilan": baris["panggilan"],
                "gagal": baris["gagal"],
                "biaya_rupiah": rupiah_dari_token(
                    baris["token_masuk"] or 0, baris["token_keluar"] or 0
                ),
            }
            for baris in per_alat
        ],
        "panggilan_terakhir": [
            {
                "waktu": satu.created_at.isoformat(),
                "endpoint": satu.endpoint,
                "status": satu.status,
                "lama_ms": satu.latency_ms,
                "biaya_rupiah": rupiah_dari_token(satu.prompt_tokens, satu.output_tokens),
            }
            for satu in terakhir
        ],
    }


def webhook_bermasalah() -> list[dict[str, Any]]:
    """Webhook yang gagal, belum diproses, atau bertanda tangan tidak sah.

    Tiap baris di sini berpotensi berarti satu orang yang sudah membayar tapi
    tidak pernah menerima akun.
    """
    peristiwa = WebhookEvent.objects.filter(
        Q(signature_valid=False) | Q(processed_at__isnull=True) | ~Q(error="")
    ).order_by("-created_at")[:50]

    return [
        {
            "id": satu.id,
            "external_id": satu.external_id,
            "provider": satu.provider,
            "tanda_tangan_sah": satu.signature_valid,
            "sudah_diproses": satu.processed_at is not None,
            "error": satu.error,
            "waktu": satu.created_at.isoformat(),
        }
        for satu in peristiwa
    ]
