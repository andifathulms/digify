"""Path endpoint optimizer.

Path di file ini DIKUNCI oleh docs/API_CONTRACT.md. Jangan diubah, jangan
ditambah alias, jangan dibuat versi jamak/tunggal yang berbeda.
"""

from django.urls import path

from apps.optimizer.views.health import HealthView

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
]
