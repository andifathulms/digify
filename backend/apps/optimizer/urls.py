"""Path endpoint optimizer.

Path di file ini DIKUNCI oleh docs/API_CONTRACT.md. Jangan diubah, jangan
ditambah alias, jangan dibuat versi jamak/tunggal yang berbeda.
"""

from django.urls import path

from apps.optimizer.views.cost_calculator import CostCalculatorView
from apps.optimizer.views.health import HealthView
from apps.optimizer.views.menu_engineering import MenuEngineeringView
from apps.optimizer.views.pricing import PricingView
from apps.optimizer.views.ranking import RankingView

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("cost-calculator", CostCalculatorView.as_view(), name="cost-calculator"),
    path("pricing", PricingView.as_view(), name="pricing"),
    path("ranking", RankingView.as_view(), name="ranking"),
    path("menu-engineering", MenuEngineeringView.as_view(), name="menu-engineering"),
]
