"""Admin bonus kuota — dibaca saja, pemberiannya lewat panel."""

from django.contrib import admin
from django.http import HttpRequest

from apps.panel.models import BonusKuota


@admin.register(BonusKuota)
class BonusKuotaAdmin(admin.ModelAdmin):
    list_display = ["date", "user", "jumlah", "alasan", "diberikan_oleh", "created_at"]
    list_filter = ["date"]
    search_fields = ["user__email", "alasan"]
    date_hierarchy = "date"
    ordering = ["-created_at"]
    readonly_fields = ["user", "date", "jumlah", "alasan", "diberikan_oleh", "created_at"]

    def has_add_permission(self, request: HttpRequest) -> bool:
        # Diberikan lewat panel supaya selalu tercatat siapa yang memberi.
        return False

    def has_change_permission(self, request: HttpRequest, obj=None) -> bool:  # noqa: ANN001
        return False
