"""Path akun, sesi, dan webhook pembayaran."""

from django.urls import path

from apps.accounts.views import (
    GantiKataSandiView,
    MasukView,
    ProfilView,
    SegarkanView,
    WebhookAffiliateIdView,
)

urlpatterns = [
    path("auth/masuk", MasukView.as_view(), name="auth-masuk"),
    path("auth/segarkan", SegarkanView.as_view(), name="auth-segarkan"),
    path("auth/saya", ProfilView.as_view(), name="auth-saya"),
    path("auth/ganti-kata-sandi", GantiKataSandiView.as_view(), name="auth-ganti-kata-sandi"),
    path("webhooks/affiliate-id", WebhookAffiliateIdView.as_view(), name="webhook-affiliate-id"),
]
