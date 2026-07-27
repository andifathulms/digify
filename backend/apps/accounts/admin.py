"""Admin akun & lisensi — dipakai Owner yang non-IT, jadi label Bahasa Indonesia."""

from django.contrib import admin

from apps.accounts.models import License, User, WebhookEvent


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["email", "full_name", "whatsapp", "is_active", "date_joined"]
    list_filter = ["is_active", "must_change_password", "is_staff"]
    search_fields = ["email", "full_name", "whatsapp"]
    ordering = ["-date_joined"]
    readonly_fields = ["date_joined", "last_login", "password"]


@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display = ["key", "user", "status", "order_id", "amount", "activated_at"]
    list_filter = ["status", "plan"]
    search_fields = ["key", "order_id", "user__email"]
    ordering = ["-created_at"]


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ["external_id", "provider", "signature_valid", "processed_at", "created_at"]
    list_filter = ["provider", "signature_valid"]
    search_fields = ["external_id"]
    ordering = ["-created_at"]
    # Catatan mentah: dibaca saja, tidak pernah diubah tangan.
    readonly_fields = [
        "provider",
        "external_id",
        "payload",
        "signature_valid",
        "processed_at",
        "error",
        "created_at",
    ]

    def has_add_permission(self, request) -> bool:  # noqa: ANN001
        return False
