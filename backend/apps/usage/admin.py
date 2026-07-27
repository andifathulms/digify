"""Admin pemakaian — supaya Owner bisa melihat siapa yang pemakaiannya tidak wajar."""

from django.contrib import admin
from django.db.models import Avg, Count, QuerySet
from django.http import HttpRequest

from apps.usage.models import DailyQuota, UsageLog


@admin.register(UsageLog)
class UsageLogAdmin(admin.ModelAdmin):
    list_display = ["created_at", "user", "endpoint", "status", "latency_ms", "retry_count"]
    list_filter = ["status", "endpoint", "created_at"]
    search_fields = ["user__email", "endpoint"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]
    readonly_fields = ["user", "endpoint", "status", "latency_ms", "retry_count", "created_at"]

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj=None) -> bool:  # noqa: ANN001
        return False

    def get_queryset(self, request: HttpRequest) -> QuerySet:
        return super().get_queryset(request).select_related("user")


@admin.register(DailyQuota)
class DailyQuotaAdmin(admin.ModelAdmin):
    list_display = ["date", "user", "count"]
    list_filter = ["date"]
    search_fields = ["user__email"]
    date_hierarchy = "date"
    ordering = ["-date", "-count"]

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def get_queryset(self, request: HttpRequest) -> QuerySet:
        return super().get_queryset(request).select_related("user")

    def changelist_view(self, request: HttpRequest, extra_context=None):  # noqa: ANN001
        """Tampilkan ringkasan di atas daftar: berapa panggilan hari ini dan
        rata-rata per user. Owner non-IT tidak akan menulis query sendiri."""
        respons = super().changelist_view(request, extra_context)
        try:
            queryset = respons.context_data["cl"].queryset
        except (AttributeError, KeyError):
            return respons

        ringkasan = queryset.aggregate(jumlah_user=Count("user", distinct=True), rata=Avg("count"))
        respons.context_data["title"] = (
            f"Kuota harian — {ringkasan['jumlah_user'] or 0} pengguna, "
            f"rata-rata {round(ringkasan['rata'] or 0, 1)} panggilan"
        )
        return respons
