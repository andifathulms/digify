"""Path panel pengawasan.

Di bawah /api/panel/ — kontrak 9 endpoint optimizer di docs/API_CONTRACT.md
tidak disentuh sama sekali.
"""

from django.urls import path

from apps.panel.views import (
    BonusKuotaView,
    DaftarKlienView,
    DetailKlienView,
    ResetKataSandiView,
    RingkasanView,
    UbahAktifView,
    WebhookBermasalahView,
)

urlpatterns = [
    path("panel/ringkasan", RingkasanView.as_view(), name="panel-ringkasan"),
    path("panel/klien", DaftarKlienView.as_view(), name="panel-klien"),
    path("panel/klien/<int:user_id>", DetailKlienView.as_view(), name="panel-klien-detail"),
    path("panel/klien/<int:user_id>/bonus", BonusKuotaView.as_view(), name="panel-bonus"),
    path(
        "panel/klien/<int:user_id>/reset-sandi",
        ResetKataSandiView.as_view(),
        name="panel-reset-sandi",
    ),
    path("panel/klien/<int:user_id>/aktif", UbahAktifView.as_view(), name="panel-aktif"),
    path("panel/webhook", WebhookBermasalahView.as_view(), name="panel-webhook"),
]
