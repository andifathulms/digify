"""Path katalog menu."""

from django.urls import path

from apps.catalog.views import MenuView

urlpatterns = [
    path("menu", MenuView.as_view(), name="menu"),
]
