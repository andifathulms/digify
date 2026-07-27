"""Peta URL utama. Semua endpoint hidup di bawah prefix /api."""

from django.contrib import admin
from django.http import HttpRequest, JsonResponse
from django.urls import include, path

from apps.ai.errors import PESAN_TIDAK_ADA, PESAN_UMUM

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.optimizer.urls")),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.catalog.urls")),
]


# 404 dan 500 dari level URL resolver tidak lewat exception handler DRF.
# Tanpa ini, user bisa melihat halaman HTML berbahasa Inggris dari Django.
def handler404(request: HttpRequest, exception: Exception) -> JsonResponse:
    return JsonResponse({"error": PESAN_TIDAK_ADA}, status=404)


def handler500(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"error": PESAN_UMUM}, status=500)
