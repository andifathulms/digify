"""Admin katalog menu."""

from django.contrib import admin

from apps.catalog.models import MenuItem


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "cogs", "price", "weekly_sales", "status", "updated_at"]
    list_filter = ["status"]
    search_fields = ["name", "user__email"]
    ordering = ["user", "name"]
